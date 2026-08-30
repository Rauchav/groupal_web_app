import { differenceInCalendarDays } from "date-fns"
import { paymentsDb } from "@/lib/mock/payments-db"
import { checkPaymentMethodValidity } from "@/lib/payments/gateway"
import { HEALTH_CHECK_WINDOW_DAYS } from "@/lib/payments/constants"
import type { Deal } from "@/lib/types/deal"

// Scheduled to run 4-5 days before a deal's deadlineAt, for every
// participation still at RESERVATION_PAID on that deal. Purely proactive —
// it simulates a lightweight validity check on the saved mock payment
// method and, on failure, nudges the buyer to update it before the final
// charge is due. It never changes participation status.

export function isWithinHealthCheckWindow(deal: Pick<Deal, "deadlineAt">, now = new Date()): boolean {
  const daysUntilDeadline = differenceInCalendarDays(deal.deadlineAt, now)
  return daysUntilDeadline >= HEALTH_CHECK_WINDOW_DAYS.min && daysUntilDeadline <= HEALTH_CHECK_WINDOW_DAYS.max
}

export async function runCardHealthCheckForDeal(deal: Deal, now = new Date()): Promise<void> {
  if (!isWithinHealthCheckWindow(deal, now)) return

  const participations = paymentsDb.listParticipationsByDealAndStatus(deal.id, "RESERVATION_PAID")
  for (const participation of participations) {
    const { valid } = await checkPaymentMethodValidity(participation.paymentMethodRef)
    if (valid) continue

    paymentsDb.createNotification({
      userId:  participation.buyerId,
      type:    "PAYMENT_REMINDER",
      title:   "Quick check on your payment method",
      message: `Your ${deal.productName} deal closes soon and we noticed an issue with your saved card. Update it now so your final payment goes through smoothly when the deal closes.`,
      data:    { dealId: deal.id, participationId: participation.id },
    })
  }
}

// Sweep entry point — call this for every active deal on a periodic (e.g.
// daily) cron; the per-deal window check above makes it a no-op for deals
// outside the 4-5 day window.
export async function runCardHealthCheckSweep(deals: Deal[], now = new Date()): Promise<void> {
  for (const deal of deals) {
    await runCardHealthCheckForDeal(deal, now)
  }
}
