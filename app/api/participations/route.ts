import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"
import { dealInclude } from "@/lib/api/deal-include"

// GET /api/participations — the signed-in buyer's own group buys, newest
// first, each with its full Deal embedded (via the same include every
// other deal-returning route uses) so the dashboard/purchases pages don't
// need a second round-trip per participation to render price/progress info.
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const participations = await prisma.groupBuyParticipation.findMany({
    where: { buyerId: user.id },
    include: { deal: { include: dealInclude } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ participations })
}
