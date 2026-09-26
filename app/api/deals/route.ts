import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"
import { dealInclude } from "@/lib/api/deal-include"
import { sellerDealPublishedCopy } from "@/lib/notifications/copy"
import { createNotification } from "@/lib/notifications/create-notification"
import { sendNewDealMarketingEmails } from "@/lib/email/send"
import { getCategoryRule } from "@/lib/constants/category-rules"

// GET /api/deals — list, optionally filtered:
//   ?sellerId=<SellerProfile.id>   a seller's own deals (any status) —
//     Active/Closed Deals lists, the create-deal redirect target.
//   ?status=active|completed       buyer-facing browsing (home, /deals,
//     "Deals That Delivered").
// No auth required — deal browsing is public, same as today's mock
// MOCK_DEALS reads.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sellerId = searchParams.get("sellerId") ?? undefined
  const statusParam = searchParams.get("status")
  const status = statusParam ? (statusParam.toUpperCase() as "ACTIVE" | "COMPLETED" | "CANCELLED") : undefined

  const deals = await prisma.deal.findMany({
    where: { sellerId, status },
    include: dealInclude,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ deals })
}

const pickupDetailsSchema = z.object({
  location: z.string().min(1),
  hours: z.string().min(1),
  instructions: z.string().min(1),
  codeRequired: z.string().min(1),
  documentsRequired: z.string().min(1),
  contactName: z.string().min(1),
  contactPhone: z.string().min(1),
  contactEmail: z.string().min(1),
})

const createSchema = z
  .object({
    productName: z.string().min(3),
    productDescription: z.string().max(2000).optional().or(z.literal("")),
    productImages: z.array(z.string().url()).min(1),
    category: z.string().min(1),
    originalPrice: z.number().positive(),
    currency: z.string().default("USD"),
    // No hardcoded min/max here — the real bounds are per-category
    // (lib/constants/category-rules.ts) and enforced below in
    // superRefine, since a single flat range can't express "Motors tops
    // out at 25% but Fashion goes to 65%". Kept as bare positive-number
    // checks so a wildly invalid value (negative, zero) still fails fast
    // with a clear error even before the category lookup runs.
    maxDiscountPercent: z.number().positive(),
    maxBuyersRequired: z.number().int().positive(),
    daysUntilDeadline: z.number().int().positive(),
    isPickup: z.boolean(),
    pickupDetails: pickupDetailsSchema.optional(),
    deliveryZones: z.array(z.object({ label: z.string().min(1), price: z.number().positive() })).optional(),
    externalProductUrl: z.string().url().optional().or(z.literal("")),
    reach: z
      .object({
        scope: z.enum(["city", "country", "continent"]),
        values: z.array(z.string().min(1)).min(1),
      })
      .optional(),
  })
  .refine((d) => !d.isPickup || !!d.pickupDetails, { message: "pickupDetails required when isPickup" })
  .refine((d) => d.isPickup || (d.deliveryZones && d.deliveryZones.length > 0), {
    message: "At least one delivery zone required when not isPickup",
  })
  // Hard guardrails per category (lib/constants/category-rules.ts) — the
  // server-side half of the same two-tier validation the create-deal form
  // enforces client-side. Never trust the client alone for this: a
  // request built by hand (or a future non-form caller, e.g. the seller
  // inventory sync API) must not be able to publish a deal outside its
  // category's bounds just because it skipped the browser form.
  .superRefine((d, ctx) => {
    const rule = getCategoryRule(d.category)
    if (!rule) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["category"], message: `Unknown category: ${d.category}` })
      return
    }
    if (d.maxDiscountPercent < rule.minDiscountPercent || d.maxDiscountPercent > rule.maxDiscountPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxDiscountPercent"],
        message: `${d.category} deals must offer between ${rule.minDiscountPercent}% and ${rule.maxDiscountPercent}% max discount`,
      })
    }
    if (d.daysUntilDeadline < rule.minDurationDays || d.daysUntilDeadline > rule.maxDurationDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["daysUntilDeadline"],
        message: `${d.category} deals must run between ${rule.minDurationDays} and ${rule.maxDurationDays} days`,
      })
    }
    if (d.maxBuyersRequired < rule.minBuyersRequired || d.maxBuyersRequired > rule.maxBuyersRequired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxBuyersRequired"],
        message: `${d.category} deals need between ${rule.minBuyersRequired} and ${rule.maxBuyersRequired} buyers`,
      })
    }
  })

// 3 milestone markers at 25%, 50%, and 100% of maxBuyers — same math as
// lib/mock/deals.ts's milestones(), duplicated rather than imported since
// that file (and the rest of lib/mock/) is going away once every read
// site has moved off it (this route is one of the things making that
// possible).
function buildMilestones(maxBuyers: number, maxDiscount: number) {
  const dpb = maxDiscount / maxBuyers
  const at = (pct: number, label: string) => {
    const count = Math.round(maxBuyers * pct)
    return { buyerCount: count, discountPercent: Math.round(count * dpb * 10) / 10, label }
  }
  return [at(0.25, "Getting started"), at(0.5, "Halfway"), at(1, "Max deal")]
}

// POST /api/deals — app/sellers/dashboard/deals/new/page.tsx. sellerId is
// resolved from the authenticated session's own SellerProfile, never
// trusted from the request body — a seller can only ever create a deal
// under their own account.
export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id } })
  if (!seller) return NextResponse.json({ error: "Not a seller" }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const deadlineAt = new Date()
  deadlineAt.setDate(deadlineAt.getDate() + data.daysUntilDeadline)

  const deal = await prisma.deal.create({
    data: {
      sellerId: seller.id,
      productName: data.productName,
      productDescription: data.productDescription || undefined,
      productImages: data.productImages,
      category: data.category,
      originalPrice: data.originalPrice,
      currency: data.currency,
      maxDiscountPercent: data.maxDiscountPercent,
      maxBuyersRequired: data.maxBuyersRequired,
      deadlineAt,
      deliveryType: data.isPickup ? "PICKUP" : "DELIVERY",
      pickupDetails: data.isPickup ? data.pickupDetails : undefined,
      externalProductUrl: data.externalProductUrl || undefined,
      milestones: { create: buildMilestones(data.maxBuyersRequired, data.maxDiscountPercent) },
      deliveryZones: data.isPickup ? undefined : { create: data.deliveryZones },
      reach: data.reach
        ? {
            create: data.reach.values.map((value) => ({
              scope: data.reach!.scope.toUpperCase() as "CITY" | "COUNTRY" | "CONTINENT",
              value,
            })),
          }
        : undefined,
    },
    include: dealInclude,
  })

  // Was wired in the old mock seller-deals-store's addDeal() before deal
  // creation moved to this real route (2026-09-14) — never ported over, so
  // sellers stopped getting this notification. See lib/notifications/copy.ts.
  await createNotification({
    userId: user.id,
    ...sellerDealPublishedCopy({ productName: deal.productName }),
    data: { dealId: deal.id },
  })

  // Marketing trigger 1 (lib/email/send.ts) — a new deal clearing the
  // "huge discount" bar goes out to every marketing-opted-in buyer.
  // Awaited, not fire-and-forget: this runs inside a serverless route
  // handler, where an un-awaited promise can be killed the instant the
  // response is sent — see createNotification's own comment on the same
  // issue. Never throws itself (errors are caught and logged inside).
  await sendNewDealMarketingEmails({
    id: deal.id,
    productName: deal.productName,
    productImages: deal.productImages,
    maxDiscountPercent: deal.maxDiscountPercent,
  })

  return NextResponse.json({ deal }, { status: 201 })
}
