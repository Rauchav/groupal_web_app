import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"
import { chargeOffSession } from "@/lib/payments/gateway"
import { paymentSuccessCopy } from "@/lib/notifications/copy"
import { createNotification } from "@/lib/notifications/create-notification"

// POST /api/participations/[id]/retry — a buyer-initiated retry of the
// final charge, from the "update payment method" link in a grace-period
// reminder notification. The real-DB counterpart of the old engine's
// manualRetryFinalCharge(). Auto-retries (day 1/day 2 of the grace period)
// happen in the sweep job instead (POST /api/jobs/sweep) — this route is
// only ever buyer-triggered.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { id } = await params
  const participation = await prisma.groupBuyParticipation.findUnique({ where: { id } })
  if (!participation || participation.buyerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (participation.status !== "IN_GRACE_PERIOD") {
    return NextResponse.json({ error: "This reservation isn't awaiting a retry" }, { status: 409 })
  }

  const amount = participation.finalPrice!
  const result = await chargeOffSession(participation.paymentMethodRef, amount)

  await prisma.payment.create({
    data: {
      participationId: participation.id,
      amount,
      type: "FINAL_PAYMENT",
      status: result.success ? "FINAL_PAYMENT_PAID" : "PAYMENT_FAILED",
      stripeId: result.stripeId,
      failureReason: result.failureReason,
    },
  })

  if (!result.success) {
    // A failed manual retry needs no extra notification — the buyer is
    // already looking at the page that triggered it.
    return NextResponse.json({ success: false, failureReason: result.failureReason })
  }

  const deal = await prisma.deal.findUnique({ where: { id: participation.dealId }, select: { productName: true } })
  await prisma.groupBuyParticipation.update({ where: { id: participation.id }, data: { status: "FINAL_PAYMENT_PAID" } })
  await createNotification({
    userId: user.id,
    ...paymentSuccessCopy({ productName: deal?.productName ?? "your deal", firstAttempt: false }),
    data: { dealId: participation.dealId, participationId: participation.id },
  })

  return NextResponse.json({ success: true })
}
