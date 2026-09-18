import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"
import { dealInclude } from "@/lib/api/deal-include"

// GET /api/deals/[id] — a single deal (checkout's Review Deal step, the
// seller's own deal-detail page). Public, same as GET /api/deals.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deal = await prisma.deal.findUnique({ where: { id }, include: dealInclude })
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  return NextResponse.json({ deal })
}

// DELETE /api/deals/[id] — new capability the app didn't have before
// today: a seller removing one of their own deals outright (as opposed to
// letting it run to its deadline). Ownership is checked server-side —
// the UI never has to be trusted to only show this button on the
// caller's own deals. Cascades to milestones/deliveryZones/reach/
// participations/likes/reviews per schema.prisma's onDelete: Cascade.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { id } = await params
  const deal = await prisma.deal.findUnique({ where: { id }, select: { seller: { select: { userId: true } } } })
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  if (deal.seller.userId !== user.id) {
    return NextResponse.json({ error: "You don't own this deal" }, { status: 403 })
  }

  await prisma.deal.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
