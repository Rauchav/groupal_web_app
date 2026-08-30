import { addDays } from "date-fns"
import { releaseDealSpot } from "@/lib/mock/deals"
import { paymentsDb } from "@/lib/mock/payments-db"
import { chargeOffSession } from "@/lib/payments/gateway"
import { GRACE_PERIOD_RETRY_OFFSETS_DAYS, getGracePeriodDays } from "@/lib/payments/constants"
import { scheduleAt } from "@/lib/jobs/scheduler"
import { computeDealValues, computeEstimatedFinalPrice } from "@/lib/utils/deal-calculator"
import type { Deal } from "@/lib/types/deal"
import type { Participation } from "@/lib/types/payment"

// Triggered once, when the deal's deadlineAt is reached OR
// currentBuyerCount hits maxBuyersRequired — whichever comes first.
export function isDealReadyToClose(deal: Deal, now = new Date()): boolean {
  return now >= deal.deadlineAt || deal.currentBuyerCount >= deal.maxBuyersRequired
}

function computeFinalPrice(deal: Deal, deliveryCost: number): { finalPrice: number; discountPercent: number } {
  return {
    finalPrice:      computeEstimatedFinalPrice(deal, deliveryCost),
    discountPercent: computeDealValues(deal).currentDiscountPercent,
  }
}

export async function closeDeal(deal: Deal): Promise<void> {
  const participations = paymentsDb.listParticipationsByDealAndStatus(deal.id, "RESERVATION_PAID")

  for (const participation of participations) {
    const { finalPrice, discountPercent } = computeFinalPrice(deal, participation.deliveryCost)
    paymentsDb.updateParticipation(participation.id, {
      status:               "AWAITING_FINAL_PAYMENT",
      finalDiscountPercent: discountPercent,
      finalPrice,
    })
    const updated = paymentsDb.getParticipation(participation.id)!
    await attemptFinalCharge(deal, updated)
  }
}

async function attemptFinalCharge(deal: Deal, participation: Participation): Promise<void> {
  const amount = participation.finalPrice!
  const result = await chargeOffSession(participation.paymentMethodRef, amount)

  paymentsDb.createPayment({
    participationId: participation.id,
    amount,
    type:             "FINAL_PAYMENT",
    status:           result.success ? "FINAL_PAYMENT_PAID" : "PAYMENT_FAILED",
    stripeId:         result.stripeId,
    failureReason:    result.failureReason,
  })

  if (result.success) {
    handleFinalChargeSuccess(deal, participation, { firstAttempt: true })
    return
  }

  const gracePeriodDays = getGracePeriodDays(deal.originalPrice)
  const graceDeadline = addDays(new Date(), gracePeriodDays)
  paymentsDb.updateParticipation(participation.id, {
    status: "IN_GRACE_PERIOD",
    gracePeriodDays,
    graceDeadline,
  })

  paymentsDb.createNotification({
    userId:  participation.buyerId,
    type:    "PAYMENT_FAILED",
    title:   "We couldn't process your final payment",
    message: `No worries — this happens. You have ${gracePeriodDays} days to update your payment method before your spot is affected, and we'll automatically try again in the meantime.`,
    data:    { dealId: deal.id, participationId: participation.id },
  })

  for (const offsetDays of GRACE_PERIOD_RETRY_OFFSETS_DAYS) {
    scheduleAt(addDays(new Date(), offsetDays), () => retryFinalCharge(deal, participation.id, "auto"))
  }
  scheduleAt(graceDeadline, () => resolveGracePeriodExpiry(deal, participation.id))
}

function handleFinalChargeSuccess(
  deal: Deal,
  participation: Participation,
  { firstAttempt }: { firstAttempt: boolean },
): void {
  paymentsDb.updateParticipation(participation.id, { status: "FINAL_PAYMENT_PAID" })
  paymentsDb.createNotification({
    userId:  participation.buyerId,
    type:    "PAYMENT_SUCCESS",
    title:   "Final payment complete — your order is on its way!",
    message: firstAttempt
      ? `We charged the remaining balance for ${deal.productName}. Thanks for group buying with Groupal!`
      : `Your updated payment method worked — we've charged the remaining balance for ${deal.productName}. Thanks for your patience!`,
    data: { dealId: deal.id, participationId: participation.id },
  })
  triggerFulfillment(deal, participation)
}

// Auto-retry (called by the scheduler at day 1 and day 2 of the grace
// period) or a buyer-initiated manual retry from the "update payment
// method" link in a reminder notification/email.
export async function retryFinalCharge(
  deal: Deal,
  participationId: string,
  trigger: "auto" | "manual",
): Promise<void> {
  const participation = paymentsDb.getParticipation(participationId)
  if (!participation || participation.status !== "IN_GRACE_PERIOD") return // already resolved

  const amount = participation.finalPrice!
  const result = await chargeOffSession(participation.paymentMethodRef, amount)

  paymentsDb.createPayment({
    participationId: participation.id,
    amount,
    type:             "FINAL_PAYMENT",
    status:           result.success ? "FINAL_PAYMENT_PAID" : "PAYMENT_FAILED",
    stripeId:         result.stripeId,
    failureReason:    result.failureReason,
  })

  if (result.success) {
    handleFinalChargeSuccess(deal, participation, { firstAttempt: false })
    return
  }

  if (trigger === "auto") {
    paymentsDb.updateParticipation(participation.id, { retryAttempts: participation.retryAttempts + 1 })
    paymentsDb.createNotification({
      userId:  participation.buyerId,
      type:    "PAYMENT_REMINDER",
      title:   "Still couldn't process your payment",
      message: `We tried again for ${deal.productName} and it didn't go through. Update your payment method any time before ${participation.graceDeadline?.toDateString()} and we'll retry right away — no pressure.`,
      data:    { dealId: deal.id, participationId: participation.id },
    })
  }
  // A failed manual retry needs no extra notification — the buyer is
  // already looking at the "update payment method" page that triggered it.
}

export async function manualRetryFinalCharge(deal: Deal, participationId: string): Promise<void> {
  return retryFinalCharge(deal, participationId, "manual")
}

// End of grace period, still unresolved: reservation is forfeited (not
// refunded), the spot goes back to the group, buyer gets one final,
// kind notification.
export function resolveGracePeriodExpiry(deal: Deal, participationId: string): void {
  const participation = paymentsDb.getParticipation(participationId)
  if (!participation || participation.status !== "IN_GRACE_PERIOD") return // resolved before the deadline

  paymentsDb.updateParticipation(participation.id, { status: "FORFEITED" })
  releaseDealSpot(deal.id)

  paymentsDb.createNotification({
    userId:  participation.buyerId,
    type:    "RESERVATION_FORFEITED",
    title:   "Your spot has been released",
    message: `We weren't able to complete the final payment for ${deal.productName} even after a few tries, so your reserved spot has been released back to the group. Your 10% reservation isn't refunded in this case — but you're always welcome to join another deal any time.`,
    data:    { dealId: deal.id, participationId: participation.id },
  })
}

function triggerFulfillment(deal: Deal, participation: Participation): void {
  // Hand-off point for order fulfillment / seller payout — not yet built
  // (see CLAUDE.md "Not yet built"). Kept isolated so there's a single
  // place to wire that pipeline up once it exists.
}
