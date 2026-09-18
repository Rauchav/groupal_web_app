import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"

// POST /api/deals/[id]/like — toggles the like (create if absent, delete
// if present) rather than two separate endpoints, matching the mock
// likes-store's own toggleLike() semantics exactly. Returns the resulting
// state so the caller doesn't need a second read to know which way it went.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { id: dealId } = await params
  const existing = await prisma.userLikedDeal.findUnique({
    where: { userId_dealId: { userId: user.id, dealId } },
  })

  if (existing) {
    await prisma.userLikedDeal.delete({ where: { id: existing.id } })
    return NextResponse.json({ liked: false })
  }

  await prisma.userLikedDeal.create({ data: { userId: user.id, dealId } })
  return NextResponse.json({ liked: true })
}
