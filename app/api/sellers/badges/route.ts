import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"

// GET /api/sellers/badges — the two "unseen since last visit" counts
// sellers/components/SellerDashboardNav.tsx shows for Active Deals and
// Closed Deals: the live count minus SellerProfile.lastViewedDealsCount/
// lastViewedClosedDealsCount (see schema.prisma's own comment). Returns
// zeros for a signed-in account with no seller profile yet rather than
// erroring — this only ever renders inside the already-onboarding-gated
// /sellers/dashboard/** tree, but staying defensive costs nothing.
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id } })
  if (!seller) return NextResponse.json({ active: 0, closed: 0 })

  const [activeCount, closedCount] = await Promise.all([
    prisma.deal.count({ where: { sellerId: seller.id, status: "ACTIVE" } }),
    prisma.deal.count({ where: { sellerId: seller.id, status: "COMPLETED" } }),
  ])

  return NextResponse.json({
    active: Math.max(0, activeCount - seller.lastViewedDealsCount),
    closed: Math.max(0, closedCount - seller.lastViewedClosedDealsCount),
  })
}

const markViewedSchema = z.object({ which: z.enum(["active", "closed"]) })

// POST /api/sellers/badges — called when the seller actually opens Active
// Deals or Closed Deals, snapshotting the current total so the badge
// clears (see GET above).
export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = markViewedSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id } })
  if (!seller) return NextResponse.json({ ok: true })

  if (parsed.data.which === "active") {
    const count = await prisma.deal.count({ where: { sellerId: seller.id, status: "ACTIVE" } })
    await prisma.sellerProfile.update({ where: { id: seller.id }, data: { lastViewedDealsCount: count } })
  } else {
    const count = await prisma.deal.count({ where: { sellerId: seller.id, status: "COMPLETED" } })
    await prisma.sellerProfile.update({ where: { id: seller.id }, data: { lastViewedClosedDealsCount: count } })
  }

  return NextResponse.json({ ok: true })
}
