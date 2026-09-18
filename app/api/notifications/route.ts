import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"

// GET /api/notifications — the signed-in account's own notifications,
// newest first. Shared by both the buyer and seller notifications pages
// (and their nav badges) — a notification is just a user-scoped row,
// regardless of which portal the account happens to be using.
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ notifications })
}
