import { paymentsDb } from "@/lib/mock/payments-db"
import { chargeOffSession, saveMockPaymentMethod } from "@/lib/payments/gateway"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import type { Deal } from "@/lib/types/deal"
import type { DeliveryAddressSnapshot, Participation } from "@/lib/types/payment"

export interface ChargeReservationInput {
  deal:             Deal
  buyerId:          string
  deliveryAddress?: DeliveryAddressSnapshot
  deliveryCost?:    number
}

export interface ChargeReservationResult {
  success:         boolean
  participation?:  Participation
  failureReason?:  string
}

// The "today" charge — always 10% of the store price, fixed, per
// CLAUDE.md's CRITICAL PAYMENT LOGIC. Saves a reusable mock payment method
// on the participation record so the deal-close job can charge the final
// balance off-session without asking the buyer to check out again.
export async function chargeReservation({
  deal,
  buyerId,
  deliveryAddress,
  deliveryCost = 0,
}: ChargeReservationInput): Promise<ChargeReservationResult> {
  // Hard backstop against a double reservation for the same deal — the
  // checkout page already redirects an already-joined buyer away before
  // they can reach this call, but this keeps the guarantee even if that
  // UI-level check is ever bypassed (e.g. a retried request).
  const existing = paymentsDb.getParticipationByDealAndBuyer(deal.id, buyerId)
  if (existing) {
    return { success: false, failureReason: "already_joined", participation: existing }
  }

  const computed = computeDealValues(deal)
  const paymentMethod = saveMockPaymentMethod()

  const result = await chargeOffSession(paymentMethod.ref, computed.reservationAmount)
  if (!result.success) {
    return { success: false, failureReason: result.failureReason }
  }

  const participation = paymentsDb.createParticipation({
    dealId:                 deal.id,
    buyerId,
    reservationAmount:      computed.reservationAmount,
    platformFee:            computed.sellerPlatformFeeAmount,
    deliveryCost,
    status:                 "RESERVATION_PAID",
    paymentMethodRef:       paymentMethod.ref,
    stripePaymentIntentId:  result.stripeId,
    deliveryAddress,
  })

  paymentsDb.createPayment({
    participationId: participation.id,
    amount:          computed.reservationAmount,
    type:            "RESERVATION",
    status:          "RESERVATION_PAID",
    stripeId:        result.stripeId,
  })

  paymentsDb.createNotification({
    userId:  buyerId,
    type:    "DEAL_JOINED",
    title:   "You're in!",
    message: `Your spot in ${deal.productName} is reserved. We'll charge the remaining balance automatically when the deal closes — nothing else for you to do.`,
    data:    { dealId: deal.id, participationId: participation.id },
  })

  return { success: true, participation }
}
