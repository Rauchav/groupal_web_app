import { paymentsDb } from "@/lib/mock/payments-db"
import { dealEndingSoonCopy } from "@/lib/notifications/copy"
import type { Deal } from "@/lib/types/deal"

// Same <24h threshold as the "Ending Soon" red badge shown on deal cards
// (buyers/components/marketplace/DealCard.tsx's isEndingSoon) — kept in
// sync deliberately, since this notification and that badge are describing
// the same moment in a deal's life to the same person.
const ENDING_SOON_WINDOW_HOURS = 24

export function isEndingSoon(deal: Pick<Deal, "deadlineAt">, now = new Date()): boolean {
  const hoursLeft = (deal.deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursLeft > 0 && hoursLeft < ENDING_SOON_WINDOW_HOURS
}

// No real job scheduler yet (see lib/jobs/scheduler.ts) — called from
// lib/payments/sync-deal-closures.ts's closeExpiredDeals(), which already
// sweeps every deal on every buyer/seller page load. deal.endingSoonNotified
// (mutated directly on the Deal object, same as status/currentBuyerCount
// already are) is meant to stop a buyer getting this notification more than
// once per deal, but for a SEED deal (lib/mock/deals.ts's MOCK_DEALS array —
// a plain in-memory array with no persistence layer of its own) that flag
// silently resets on every fresh page load, letting this fire again and
// again — the actual bug behind a buyer once receiving ~30 duplicate
// "ending soon" notifications for the same deal. The per-participation
// check below is the real guard now: paymentsDb.notifications IS persisted,
// so it stays true to whether this buyer was actually already notified,
// regardless of whether the in-memory flag survived. deal.endingSoonNotified
// is kept too, purely as a cheap early-exit so an already-notified active
// deal doesn't re-scan its participant list on every sweep.
export function notifyIfEndingSoon(deal: Deal, now = new Date()): void {
  if (deal.status !== "active" || deal.endingSoonNotified || !isEndingSoon(deal, now)) return
  deal.endingSoonNotified = true

  const participants = paymentsDb.listParticipationsByDealAndStatus(deal.id, "RESERVATION_PAID")
  for (const participation of participants) {
    if (paymentsDb.hasNotificationForParticipation(participation.buyerId, "DEAL_ENDING_SOON", participation.id)) continue
    paymentsDb.createNotification({
      userId: participation.buyerId,
      ...dealEndingSoonCopy({ productName: deal.productName }),
      data: { dealId: deal.id, participationId: participation.id },
    })
  }
}
