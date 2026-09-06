import { MOCK_DEALS } from "@/lib/mock/deals"
import { paymentsDb } from "@/lib/mock/payments-db"
import { isDealReadyToClose, closeDeal } from "@/lib/jobs/deal-close-job"
import { useParticipationStore, type MockParticipation } from "@/buyers/stores/participation-store"
import type { Participation, PaymentStatus } from "@/lib/types/payment"

// The engine's richer status machine collapses onto the simple store's
// three-state model. AWAITING_FINAL_PAYMENT / PAYMENT_FAILED / IN_GRACE_PERIOD
// all stay "active" — the buyer sees what's happening via the notifications
// the engine already creates for those states, rather than this bridge
// growing a second copy of that status machine.
function toSimpleStatus(status: PaymentStatus): MockParticipation["status"] {
  if (status === "FINAL_PAYMENT_PAID") return "completed"
  if (status === "FORFEITED" || status === "REFUNDED") return "forfeited"
  return "active"
}

function toSimpleParticipation(p: Participation): MockParticipation {
  return {
    id: p.id,
    dealId: p.dealId,
    joinedAt: p.createdAt.toISOString(),
    reservationPaid: p.reservationAmount,
    status: toSimpleStatus(p.status),
    deliveryAddress: {
      street:  p.deliveryAddress?.street  ?? "",
      city:    p.deliveryAddress?.city    ?? "",
      state:   p.deliveryAddress?.state   ?? "",
      country: p.deliveryAddress?.country ?? "",
      zipCode: p.deliveryAddress?.zipCode ?? "",
    },
  }
}

// Sweeps every deal in the marketplace — not just ones the current buyer
// happens to have joined — and closes any that have hit their deadline or
// max buyer count: runs the deal-close job (final charges, notifications)
// for every RESERVATION_PAID participation on that deal across ALL buyers,
// then marks the deal itself "completed" so it drops out of the public
// "Active Group Buys" listing and can surface in "Deals That Delivered".
// There's no real job scheduler yet (see lib/jobs/scheduler.ts), so this is
// the mock stand-in — call it from any page that reads deal data (deals
// browse, homepage, dashboard) rather than only from a signed-in buyer's
// own dashboard. Idempotent: a deal already marked "completed" is skipped,
// so calling this repeatedly (e.g. on every page load) never re-processes
// the same deal twice.
export async function closeExpiredDeals(): Promise<void> {
  for (const deal of MOCK_DEALS) {
    if (deal.status !== "active" || !isDealReadyToClose(deal)) continue
    await closeDeal(deal)
    deal.status = "completed"
  }
}

// The bridge between the richer payment engine (lib/payments/, lib/jobs/)
// and participation-store, the simpler store the dashboard/purchases pages
// actually render from. Call this on page load for the signed-in buyer:
// sweeps every deal closed via closeExpiredDeals() above, backfills any
// engine participation missing from the simple store (this happens
// whenever a reservation charge succeeds in the engine but the buyer's
// browser gets redirected away before the checkout page's own
// addParticipation() call runs — e.g. a retried "already joined" attempt),
// then reflects each of the buyer's participations' resulting engine status
// (completed / forfeited) back onto the simple store the UI reads.
export async function syncDealClosures(buyerId: string): Promise<void> {
  await closeExpiredDeals()

  const store = useParticipationStore.getState()

  const enginePs = paymentsDb.listParticipationsByBuyer(buyerId)
  for (const ep of enginePs) {
    if (!store.hasJoined(ep.dealId)) {
      store.addParticipation(toSimpleParticipation(ep))
    }
  }

  const activeParticipations = useParticipationStore.getState().participations.filter((p) => p.status === "active")
  for (const p of activeParticipations) {
    const enginePart = paymentsDb.getParticipationByDealAndBuyer(p.dealId, buyerId)
    if (enginePart?.status === "FINAL_PAYMENT_PAID") {
      store.setParticipationStatus(p.dealId, "completed")
    } else if (enginePart?.status === "FORFEITED") {
      store.setParticipationStatus(p.dealId, "forfeited")
    }
  }
}
