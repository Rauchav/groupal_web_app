import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"
import { dealInclude } from "@/lib/api/deal-include"

// GET /api/likes — the signed-in buyer's liked deals. Returns both
// `dealIds` (cheap heart-state checks across many DealCards at once — see
// buyers/stores/likes-store.ts) and `deals` (full ApiDeal objects, for the
// Liked Deals page's gallery) in one call, since both consumers need the
// same underlying query.
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const liked = await prisma.userLikedDeal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { deal: { include: dealInclude } },
  })

  return NextResponse.json({
    dealIds: liked.map((l) => l.dealId),
    deals: liked.map((l) => l.deal),
  })
}
