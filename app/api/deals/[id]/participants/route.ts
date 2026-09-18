import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"

// GET /api/deals/[id]/participants — the seller-only "who's in the group"
// list on app/sellers/dashboard/deals/[id]/page.tsx. Ownership-checked
// server-side, same as the deal DELETE route — a seller can only ever see
// the buyer list for their own deal.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { id: dealId } = await params
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { seller: { select: { userId: true } } } })
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  if (deal.seller.userId !== user.id) {
    return NextResponse.json({ error: "You don't own this deal" }, { status: 403 })
  }

  const participations = await prisma.groupBuyParticipation.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ participations })
}
