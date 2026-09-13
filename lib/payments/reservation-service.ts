import { paymentsDb } from "@/lib/mock/payments-db"
import { chargeOffSession, saveMockPaymentMethod } from "@/lib/payments/gateway"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import { dealJoinedCopy, dealProgressCopy, sellerNewBuyerCopy } from "@/lib/notifications/copy"
import { persistSellerDealMutations } from "@/sellers/stores/seller-deals-store"
import type { Deal } from "@/lib/types/deal"
import type { DeliveryAddressSnapshot, Participation } from "@/lib/types/payment"

export interface ChargeReservationInput {
  deal:             Deal
  buyerId:          string
  buyerName:        string
  buyerAvatarUrl?:  string
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
  buyerName,
  buyerAvatarUrl,
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
    buyerName,
    buyerAvatarUrl,
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

  // Everyone else already in the group, captured BEFORE deal.currentBuyerCount
  // below moves — they each get a "your discount just grew" nudge; the
  // buyer who just joined gets their own "you're in!" notification instead.
  const otherParticipants = paymentsDb
    .listParticipationsByDealAndStatus(deal.id, "RESERVATION_PAID")
    .filter((p) => p.id !== participation.id)

  // Mirrors releaseDealSpot()'s decrement on forfeiture (lib/mock/deals.ts)
  // — every successful join grows the live group, which is what lets a
  // deal actually reach maxBuyersRequired and auto-close (see
  // closeExpiredDeals in lib/payments/sync-deal-closures.ts). Done before
  // composing the notifications below so their buyer-count/discount
  // figures already reflect this join.
  if (deal.currentBuyerCount < deal.maxBuyersRequired) {
    deal.currentBuyerCount += 1
  }
  // See persistSellerDealMutations's own comment — without this, a
  // seller-created deal's buyer count silently reverts on the next reload.
  persistSellerDealMutations()
  const updatedComputed = computeDealValues(deal)

  paymentsDb.createNotification({
    userId: buyerId,
    ...dealJoinedCopy({ productName: deal.productName }),
    data: { dealId: deal.id, participationId: participation.id },
  })

  paymentsDb.createNotification({
    userId: deal.sellerUserId,
    ...sellerNewBuyerCopy({
      productName:     deal.productName,
      buyerCount:      deal.currentBuyerCount,
      maxBuyers:       deal.maxBuyersRequired,
      discountPercent: updatedComputed.currentDiscountPercent,
    }),
    data: { dealId: deal.id },
  })

  // Note: on a very popular deal this sends one notification per existing
  // participant on every single new join — intentional per how the
  // discount mechanic works (every buyer's price really does move every
  // time), but worth knowing if a deal's Notifications feed ever feels
  // noisy for a buyer in a large, fast-filling group.
  for (const other of otherParticipants) {
    paymentsDb.createNotification({
      userId: other.buyerId,
      ...dealProgressCopy({
        productName:     deal.productName,
        buyerCount:      deal.currentBuyerCount,
        maxBuyers:       deal.maxBuyersRequired,
        discountPercent: updatedComputed.currentDiscountPercent,
      }),
      data: { dealId: deal.id, participationId: other.id },
    })
  }

  return { success: true, participation }
}
