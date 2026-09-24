// ═══════════════════════════════════════════════════════════════════════════
// THE ONE FILE TO EDIT FOR NOTIFICATION TEXT.
//
// Every notification a buyer or a seller ever receives — from "you joined a
// deal" all the way to "your payout landed" — has its title/message written
// here, and ONLY here. Nothing in lib/payments/, lib/jobs/, or
// sellers/stores/seller-deals-store.ts hardcodes any notification copy —
// they all just call one of the functions below and pass in the numbers
// (product name, buyer count, discount %, dollar amounts). Change the
// wording here and it updates everywhere that notification fires, without
// touching any business logic.
//
// Each function's name says which NotificationType (lib/types/payment.ts)
// it belongs to and is grouped below by who receives it — buyer or seller —
// in the order those events actually happen over a deal's lifecycle:
//   seller creates a deal → buyer joins (both notified) → the deal grows as
//   more buyers join (both notified) → the deal is ending soon → the deal
//   closes (both notified, with final results) → the buyer's final charge
//   succeeds/fails/gets retried/forfeits → the seller's payout lands or hits
//   an issue.
//
// Every function returns { title, message } — the shape
// paymentsDb.createNotification() (lib/mock/payments-db.ts) expects. Keep
// that shape when editing; everything else (emoji, length, tone) is fair
// game. Tone should stay warm, friendly, and non-punitive even for bad-news
// notifications (payment failed, forfeited, payout issue) — see CLAUDE.md's
// "Design Personality" and the CRITICAL PAYMENT LOGIC section's own
// communication guidance, which this file is the direct continuation of.
// ═══════════════════════════════════════════════════════════════════════════

import type { NotificationType } from "@/lib/types/payment"

function fmt(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount)
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`
}

// Each function below returns its own `type` alongside the copy, not just
// `{ title, message }` — spread the whole thing straight into
// paymentsDb.createNotification({ userId, ...someCopy(...), data }). That
// way the NotificationType can never drift out of sync with the copy it's
// paired with (e.g. accidentally tagging dealJoinedCopy's text with a
// DEAL_PROGRESS type at some call site).
interface NotificationCopy {
  type:    NotificationType
  title:   string
  message: string
}

// ── BUYER ────────────────────────────────────────────────────────────────

// Fires once, right when a buyer's reservation charge succeeds.
// lib/payments/reservation-service.ts
export function dealJoinedCopy({ productName }: { productName: string }): NotificationCopy {
  return {
    type:    "DEAL_JOINED",
    title:   "You're in!",
    message: `Your spot in ${productName} is reserved. We'll charge the remaining balance automatically when the deal closes, nothing else for you to do.`,
  }
}

// Fires for every OTHER buyer already in the deal, each time a new buyer
// joins — the whole group's discount just grew a little. Not sent to the
// buyer who just joined (they get dealJoinedCopy above instead).
// lib/payments/reservation-service.ts
export function dealProgressCopy({
  productName, buyerCount, maxBuyers, discountPercent,
}: { productName: string; buyerCount: number; maxBuyers: number; discountPercent: number }): NotificationCopy {
  return {
    type:    "DEAL_PROGRESS",
    title:   "Your discount just grew!",
    message: `Another buyer joined ${productName}, the group is now at ${buyerCount} of ${maxBuyers} buyers, and your price just dropped to ${pct(discountPercent)} off. Share the deal to help it fill up even faster.`,
  }
}

// Fires once per deal, the first time it enters its final 24 hours — see
// lib/jobs/deal-ending-soon-job.ts.
export function dealEndingSoonCopy({ productName }: { productName: string }): NotificationCopy {
  return {
    type:    "DEAL_ENDING_SOON",
    title:   "Your deal ends in less than 24 hours",
    message: `${productName} closes soon. If you haven't already, this is a great time to share it with all your contacts, every new buyer before the deadline grows everyone's discount, including yours.`,
  }
}

// Fires once per buyer when their deal closes — the group-level "here's how
// it turned out" congratulations, sent regardless of whether THIS buyer's
// own final charge (see paymentSuccessCopy/paymentFailedCopy below) just
// succeeded or is still being worked out. Everyone who was in the group
// when it closed earned the same final discount.
// lib/jobs/deal-close-job.ts
export function dealCompletedCopy({
  productName, buyerCount, discountPercent, savingsAmount, currency,
}: { productName: string; buyerCount: number; discountPercent: number; savingsAmount: number; currency?: string }): NotificationCopy {
  return {
    type:    "DEAL_COMPLETED",
    title:   "The group buy is complete, congrats!",
    message: `${productName} closed with ${buyerCount} buyer${buyerCount === 1 ? "" : "s"} and a final group discount of ${pct(discountPercent)}. Together you saved ${fmt(savingsAmount, currency)} off the store price. Thanks for buying together with Groupal!`,
  }
}

// Fires once per buyer, right after their final charge succeeds at deal
// close (or, for firstAttempt: false, after a retried charge succeeds
// following a payment failure).
// lib/jobs/deal-close-job.ts
export function paymentSuccessCopy({
  productName, firstAttempt,
}: { productName: string; firstAttempt: boolean }): NotificationCopy {
  return {
    type:    "PAYMENT_SUCCESS",
    title:   "Final payment complete, your order is on its way!",
    message: firstAttempt
      ? `We charged the remaining balance for ${productName}. Thanks for group buying with Groupal!`
      : `Your updated payment method worked, we've charged the remaining balance for ${productName}. Thanks for your patience!`,
  }
}

// Fires once, the moment a buyer's final charge first fails at deal close.
// lib/jobs/deal-close-job.ts
export function paymentFailedCopy({
  productName, gracePeriodDays,
}: { productName: string; gracePeriodDays: number }): NotificationCopy {
  return {
    type:    "PAYMENT_FAILED",
    title:   "We couldn't process your final payment",
    message: `No worries, this happens. You have ${gracePeriodDays} days to update your payment method before your spot is affected, and we'll automatically try again in the meantime.`,
  }
}

// Fires proactively, 4-5 days before a deal's deadline, if the buyer's
// saved card fails a lightweight validity check — before any real charge
// has even been attempted.
// lib/jobs/card-health-check-job.ts
export function paymentReminderCardIssueCopy({ productName }: { productName: string }): NotificationCopy {
  return {
    type:    "PAYMENT_REMINDER",
    title:   "Quick check on your payment method",
    message: `Your ${productName} deal closes soon and we noticed an issue with your saved card. Update it now so your final payment goes through smoothly when the deal closes.`,
  }
}

// Fires after an AUTOMATIC retry (day 1 or day 2 of the grace period)
// fails again — a manual, buyer-initiated retry failing needs no extra
// notification, since the buyer is already on the page that triggered it.
// lib/jobs/deal-close-job.ts
export function paymentReminderRetryFailedCopy({
  productName, graceDeadline,
}: { productName: string; graceDeadline: Date }): NotificationCopy {
  return {
    type:    "PAYMENT_REMINDER",
    title:   "Still couldn't process your payment",
    message: `We tried again for ${productName} and it didn't go through. Update your payment method any time before ${graceDeadline.toDateString()} and we'll retry right away, no pressure.`,
  }
}

// Fires once, at the end of the grace period, if the final charge is still
// unresolved — the buyer's ONLY way to lose their reservation, and never
// because "not enough buyers joined." Keep this warm and blame-free.
// lib/jobs/deal-close-job.ts
export function reservationForfeitedCopy({ productName }: { productName: string }): NotificationCopy {
  return {
    type:    "RESERVATION_FORFEITED",
    title:   "Your spot has been released",
    message: `We weren't able to complete the final payment for ${productName} even after a few tries, so your reserved spot has been released back to the group. Your 10% reservation isn't refunded in this case, but you're always welcome to join another deal any time.`,
  }
}

// ── SELLER ───────────────────────────────────────────────────────────────

// Fires once, right after a seller successfully publishes a new deal. Kept
// short and low-key on purpose — the seller already sees a full celebration
// screen (components/success-celebration.tsx) right after publishing; this
// is just the activity-log entry for their Notifications page.
// sellers/stores/seller-deals-store.ts
export function sellerDealPublishedCopy({ productName }: { productName: string }): NotificationCopy {
  return {
    type:    "SELLER_DEAL_PUBLISHED",
    title:   "Your deal is live!",
    message: `${productName} is now visible to buyers in the Groupal marketplace. We'll notify you here every time someone joins.`,
  }
}

// Fires for the seller every time a buyer joins one of their deals.
// lib/payments/reservation-service.ts
export function sellerNewBuyerCopy({
  productName, buyerCount, maxBuyers, discountPercent,
}: { productName: string; buyerCount: number; maxBuyers: number; discountPercent: number }): NotificationCopy {
  return {
    type:    "SELLER_NEW_BUYER",
    title:   "New buyer joined!",
    message: `${buyerCount} of ${maxBuyers} buyers have now joined ${productName}, the group discount is at ${pct(discountPercent)}. Every new buyer moves you closer to selling out.`,
  }
}

// Fires once per deal when it closes — the seller's sale summary:
// how many units, at what final discount, for how much revenue, and what
// they'll net after Groupal's commission. Figures are computed once, right
// when the deal closes (see lib/jobs/deal-close-job.ts), independent of how
// long any individual buyer's final charge takes to resolve — this is the
// "your item sold" moment, separate from "the money has settled" below.
// lib/jobs/deal-close-job.ts
export function sellerDealCompletedCopy({
  productName, unitsSold, discountPercent, grossRevenue, commission, netPayout, currency,
}: {
  productName: string; unitsSold: number; discountPercent: number
  grossRevenue: number; commission: number; netPayout: number; currency?: string
}): NotificationCopy {
  return {
    type:    "SELLER_DEAL_COMPLETED",
    title:   "Your deal just closed, nice work!",
    message: `${productName} sold ${unitsSold} unit${unitsSold === 1 ? "" : "s"} at a final group discount of ${pct(discountPercent)}. Total revenue: ${fmt(grossRevenue, currency)}. After Groupal's commission (${fmt(commission, currency)}), your payout is ${fmt(netPayout, currency)} — it's on its way to your account.`,
  }
}

// Fires once per deal, shortly after sellerDealCompletedCopy above, once
// the mock payout gateway (lib/payments/gateway.ts's sendPayout) confirms
// the transfer went through.
// lib/jobs/deal-close-job.ts
export function sellerPayoutSentCopy({
  productName, netPayout, currency,
}: { productName: string; netPayout: number; currency?: string }): NotificationCopy {
  return {
    type:    "SELLER_PAYOUT_SENT",
    title:   "Your payout has landed!",
    message: `${fmt(netPayout, currency)} for ${productName} has been deposited into your account. Thanks for selling with Groupal!`,
  }
}

// Fires instead of sellerPayoutSentCopy if the mock payout attempt fails.
// Keep this reassuring, not alarming — nothing punitive, and no action the
// seller needs to take themselves.
// lib/jobs/deal-close-job.ts
export function sellerPayoutIssueCopy({
  productName, netPayout, currency,
}: { productName: string; netPayout: number; currency?: string }): NotificationCopy {
  return {
    type:    "SELLER_PAYOUT_ISSUE",
    title:   "We hit a snag sending your payout",
    message: `We ran into an issue sending your ${fmt(netPayout, currency)} payout for ${productName}. Nothing you need to do right now, our team is already reviewing it. Reach out to Groupal support any time if you'd like an update.`,
  }
}
