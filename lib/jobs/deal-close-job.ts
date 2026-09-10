import { addDays } from "date-fns"
import { releaseDealSpot } from "@/lib/mock/deals"
import { paymentsDb } from "@/lib/mock/payments-db"
import { chargeOffSession, sendPayout } from "@/lib/payments/gateway"
import { GRACE_PERIOD_RETRY_OFFSETS_DAYS, getGracePeriodDays } from "@/lib/payments/constants"
import { scheduleAt } from "@/lib/jobs/scheduler"
import { computeDealValues, computeEstimatedFinalPrice } from "@/lib/utils/deal-calculator"
import {
  dealCompletedCopy, paymentSuccessCopy, paymentFailedCopy,
  paymentReminderRetryFailedCopy, reservationForfeitedCopy,
  sellerDealCompletedCopy, sellerPayoutSentCopy, sellerPayoutIssueCopy,
} from "@/lib/notifications/copy"
import { persistSellerDealMutations } from "@/sellers/stores/seller-deals-store"
import type { Deal, DealComputedValues } from "@/lib/types/deal"
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
  // Nobody joined before the deadline — nothing to charge, and no seller
  // sale to celebrate (see settleSellerPayout below, which the empty-check
  // there also guards against).
  if (participations.length === 0) return

  // The deal's final discount/price is deterministic the instant it closes
  // — currentBuyerCount doesn't change again after this point — so it's
  // computed once here and reused for every buyer's dealCompletedCopy
  // below and for the seller's sale summary, rather than recomputed per
  // participant.
  const computed = computeDealValues(deal)

  for (const participation of participations) {
    const { finalPrice, discountPercent } = computeFinalPrice(deal, participation.deliveryCost)
    paymentsDb.updateParticipation(participation.id, {
      status:               "AWAITING_FINAL_PAYMENT",
      finalDiscountPercent: discountPercent,
      finalPrice,
    })
    const updated = paymentsDb.getParticipation(participation.id)!

    // The group-level "it's over, here's how it went" congratulations —
    // sent to every buyer who was still in the group when it closed,
    // independent of whether THEIR OWN final charge (attempted right
    // below) succeeds, fails, or ends up in a grace period. Everyone
    // earned the same final discount regardless of their own payment
    // outcome, so everyone gets this.
    paymentsDb.createNotification({
      userId: participation.buyerId,
      ...dealCompletedCopy({
        productName:     deal.productName,
        buyerCount:      deal.currentBuyerCount,
        discountPercent: computed.currentDiscountPercent,
        savingsAmount:   computed.savingsAmount,
        currency:        deal.currency,
      }),
      data: { dealId: deal.id, participationId: participation.id },
    })

    await attemptFinalCharge(deal, updated)
  }

  await settleSellerPayout(deal, participations.length, computed)
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
    userId: participation.buyerId,
    ...paymentFailedCopy({ productName: deal.productName, gracePeriodDays }),
    data: { dealId: deal.id, participationId: participation.id },
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
    userId: participation.buyerId,
    ...paymentSuccessCopy({ productName: deal.productName, firstAttempt }),
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
      userId: participation.buyerId,
      ...paymentReminderRetryFailedCopy({ productName: deal.productName, graceDeadline: participation.graceDeadline! }),
      data: { dealId: deal.id, participationId: participation.id },
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
  // See persistSellerDealMutations's own comment — releaseDealSpot just
  // decremented deal.currentBuyerCount in place.
  persistSellerDealMutations()

  paymentsDb.createNotification({
    userId: participation.buyerId,
    ...reservationForfeitedCopy({ productName: deal.productName }),
    data: { dealId: deal.id, participationId: participation.id },
  })
}

function triggerFulfillment(deal: Deal, participation: Participation): void {
  // Hand-off point for order fulfillment — not yet built (see CLAUDE.md
  // "Not yet built"). Kept isolated so there's a single place to wire that
  // pipeline up once it exists. (Seller payout itself is handled per-deal
  // by settleSellerPayout below, not per-participation here.)
}

// The seller's side of a deal closing — one sale summary, then one payout
// attempt, both fired once the whole buyer loop in closeDeal() above has
// finished. Revenue/commission use the SAME currentPrice/
// sellerPlatformFeeAmount basis as the "Revenue" stat card on
// app/sellers/dashboard/page.tsx, for consistency: gross per-unit revenue
// is the group-discounted currentPrice (not the store price), and the
// commission is Groupal's flat originalPrice-based fee — see
// CLAUDE.md's CRITICAL PAYMENT LOGIC for why the fee is originalPrice-based
// while revenue is currentPrice-based.
async function settleSellerPayout(deal: Deal, unitsSold: number, computed: DealComputedValues): Promise<void> {
  const grossRevenue = computed.currentPrice * unitsSold
  const commission   = computed.sellerPlatformFeeAmount * unitsSold
  const netPayout    = grossRevenue - commission

  paymentsDb.createNotification({
    userId: deal.sellerUserId,
    ...sellerDealCompletedCopy({
      productName:     deal.productName,
      unitsSold,
      discountPercent: computed.currentDiscountPercent,
      grossRevenue,
      commission,
      netPayout,
      currency:        deal.currency,
    }),
    data: { dealId: deal.id },
  })

  // No real Payout/Payment record for this yet — PaymentRecord
  // (lib/types/payment.ts) is scoped to a single participation, while a
  // payout is a deal-level aggregate across every buyer. That's a real
  // schema gap to close when the database milestone adds a proper Payout
  // model; for now the notification itself is the audit trail.
  const payoutResult = await sendPayout(netPayout)

  if (payoutResult.success) {
    paymentsDb.createNotification({
      userId: deal.sellerUserId,
      ...sellerPayoutSentCopy({ productName: deal.productName, netPayout, currency: deal.currency }),
      data: { dealId: deal.id },
    })
  } else {
    paymentsDb.createNotification({
      userId: deal.sellerUserId,
      ...sellerPayoutIssueCopy({ productName: deal.productName, netPayout, currency: deal.currency }),
      data: { dealId: deal.id },
    })
  }
}
