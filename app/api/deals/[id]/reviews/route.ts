import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"

// GET /api/deals/[id]/reviews — the signed-in buyer's OWN review for this
// deal, or null (used to prefill the "Edit review" form). Deal-wide review
// listings aren't needed anywhere in the UI today — see
// GET /api/reviews for the one place that shows other buyers' reviews (a
// global "recent reviews" feed on the homepage, not filtered to one deal).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { id: dealId } = await params
  const review = await prisma.review.findUnique({
    where: { dealId_buyerId: { dealId, buyerId: user.id } },
  })

  return NextResponse.json({ review })
}

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000),
  buyerName: z.string().min(1),
})

// POST /api/deals/[id]/reviews — create-or-update (unique [dealId, buyerId]
// per schema.prisma), matching the mock reviews-store's addOrUpdateReview()
// semantics exactly — the "Review this product" / "Edit review" CTA on
// ClosedDealPaymentSummary always calls this same endpoint either way.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = reviewSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const { id: dealId } = await params

  const review = await prisma.review.upsert({
    where: { dealId_buyerId: { dealId, buyerId: user.id } },
    update: { rating: data.rating, comment: data.comment, buyerName: data.buyerName },
    create: { dealId, buyerId: user.id, rating: data.rating, comment: data.comment, buyerName: data.buyerName },
  })

  return NextResponse.json({ review })
}
