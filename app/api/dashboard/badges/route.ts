import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"
import type { PaymentStatus } from "@/lib/generated/prisma"

const CLOSED_STATUSES: PaymentStatus[] = ["FINAL_PAYMENT_PAID", "FORFEITED", "REFUNDED"]

// GET /api/dashboard/badges — the two "unseen since last visit" counts
// buyers/components/dashboard/DashboardNav.tsx shows for My Group Buys and
// Purchases: the live count minus User.lastViewedGroupBuysCount/
// lastViewedPurchasesCount (see schema.prisma's own comment on why those
// moved here from localStorage). The Notifications badge is a separate,
// live unread count with its own store (lib/notifications/notifications-store.ts)
// — deliberately not folded in here, since it and this endpoint's counts
// clear on different triggers (opening Notifications must NOT clear it the
// way opening the other two pages clears theirs).
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const [totalParticipations, closedParticipations] = await Promise.all([
    prisma.groupBuyParticipation.count({ where: { buyerId: user.id } }),
    prisma.groupBuyParticipation.count({ where: { buyerId: user.id, status: { in: CLOSED_STATUSES } } }),
  ])

  return NextResponse.json({
    groupBuys: Math.max(0, totalParticipations - user.lastViewedGroupBuysCount),
    purchases: Math.max(0, closedParticipations - user.lastViewedPurchasesCount),
  })
}

const markViewedSchema = z.object({ which: z.enum(["groupBuys", "purchases"]) })

// POST /api/dashboard/badges/mark-viewed — called when the buyer actually
// opens My Group Buys or Purchases, snapshotting the current total so the
// badge clears (see GET above).
export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = markViewedSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (parsed.data.which === "groupBuys") {
    const count = await prisma.groupBuyParticipation.count({ where: { buyerId: user.id } })
    await prisma.user.update({ where: { id: user.id }, data: { lastViewedGroupBuysCount: count } })
  } else {
    const count = await prisma.groupBuyParticipation.count({
      where: { buyerId: user.id, status: { in: CLOSED_STATUSES } },
    })
    await prisma.user.update({ where: { id: user.id }, data: { lastViewedPurchasesCount: count } })
  }

  return NextResponse.json({ ok: true })
}
