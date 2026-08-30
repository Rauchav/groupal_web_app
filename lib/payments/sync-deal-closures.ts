import { MOCK_DEALS } from "@/lib/mock/deals"
import { paymentsDb } from "@/lib/mock/payments-db"
import { isDealReadyToClose, closeDeal } from "@/lib/jobs/deal-close-job"
import { useParticipationStore, type MockParticipation } from "@/lib/stores/participation-store"
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

// The bridge between the richer payment engine (lib/payments/, lib/jobs/)
// and participation-store, the simpler store the dashboard/purchases pages
// actually render from. Call this on page load (there's no real job
// scheduler yet — see lib/jobs/scheduler.ts) for every deal the signed-in
// buyer has an active participation in: if a deal's deadline has passed or
// it hit max buyers, this runs the deal-close job for it (a no-op if
// already closed — closeDeal only touches RESERVATION_PAID participations)
// and copies the outcome back onto the buyer's dashboard-visible status.
//
// Also backfills any engine participation missing from the simple store —
// this happens whenever a reservation charge succeeds in the engine but the
// buyer's browser gets redirected away before the checkout page's own
// addParticipation() call runs (e.g. a retried "already joined" attempt).
// Without this, a deal the buyer genuinely joined would silently never
// appear on their dashboard.
export async function syncDealClosures(buyerId: string): Promise<void> {
  const store = useParticipationStore.getState()

  const enginePs = paymentsDb.listParticipationsByBuyer(buyerId)
  for (const ep of enginePs) {
    if (!store.hasJoined(ep.dealId)) {
      store.addParticipation(toSimpleParticipation(ep))
    }
  }

  const activeParticipations = useParticipationStore.getState().participations.filter((p) => p.status === "active")

  for (const p of activeParticipations) {
    const deal = MOCK_DEALS.find((d) => d.id === p.dealId)
    if (!deal || !isDealReadyToClose(deal)) continue

    await closeDeal(deal)

    const enginePart = paymentsDb.getParticipationByDealAndBuyer(deal.id, buyerId)
    if (enginePart?.status === "FINAL_PAYMENT_PAID") {
      store.setParticipationStatus(deal.id, "completed")
    } else if (enginePart?.status === "FORFEITED") {
      store.setParticipationStatus(deal.id, "forfeited")
    }
  }
}
