"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface MockParticipation {
  id: string
  dealId: string
  joinedAt: string
  reservationPaid: number
  // The rate actually charged for THIS buyer at checkout (their picked
  // delivery zone, or 0 for pickup) — not recomputed later, since a
  // seller could in principle change their zone pricing after someone's
  // already joined. Optional only so older, already-persisted
  // participations (saved before this field existed) still parse; read
  // sites fall back to the flat $9.99 default rate for those.
  deliveryCost?: number
  status: "active" | "completed" | "forfeited"
  deliveryAddress: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
}

interface ParticipationStore {
  participations: MockParticipation[]
  // True once this store's persisted state has been read back from
  // localStorage on the client. Always false during SSR (localStorage
  // doesn't exist there) and for the first client render, so components
  // can avoid branching on participations before then — otherwise the
  // client's first paint diverges from the server-rendered HTML and React
  // throws a hydration mismatch.
  hasHydrated: boolean
  // How many participations existed the last time the buyer opened "My
  // Group Buys" (app/(buyers)/dashboard/page.tsx) — the badge in
  // DashboardNav.tsx shows participations.length - lastViewedGroupBuysCount,
  // same unread-count mechanic as the seller portal's deal badges
  // (sellers/stores/seller-deals-store.ts). Joining a deal always creates
  // a new participation, so this total only ever grows — a safe thing to
  // diff against even though a participation can later disappear from
  // that page once its status leaves "active". Not scoped per-user like
  // the seller store's equivalent counts are: this whole store already
  // isn't scoped by buyer id (a known, pre-existing limitation — see
  // sellers/stores/seller-store.ts's history for the seller-side version
  // of this same gap), so neither is this.
  lastViewedGroupBuysCount: number
  // Same idea for "Purchases" (app/(buyers)/dashboard/purchases/page.tsx)
  // — how many of this buyer's participations had already left "active"
  // (i.e. status is "completed" or "forfeited") the last time that page
  // was opened. Also only ever grows: a closed participation never goes
  // back to "active".
  lastViewedClosedCount: number
  setHasHydrated: (hasHydrated: boolean) => void
  addParticipation: (p: MockParticipation) => void
  hasJoined: (dealId: string) => boolean
  getParticipation: (dealId: string) => MockParticipation | undefined
  // Bridges the deal-close job's outcome (lib/jobs/deal-close-job.ts, which
  // operates on the richer payments engine) back onto this simpler store,
  // which is what the dashboard/purchases UI actually reads.
  setParticipationStatus: (dealId: string, status: MockParticipation["status"]) => void
  markGroupBuysViewed: () => void
  markClosedViewed: () => void
}

export const useParticipationStore = create<ParticipationStore>()(
  persist(
    (set, get) => ({
      participations: [],
      hasHydrated: false,
      lastViewedGroupBuysCount: 0,
      lastViewedClosedCount: 0,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      addParticipation: (p) =>
        set((state) => ({
          participations: [...state.participations, p],
        })),
      hasJoined: (dealId) =>
        get().participations.some((p) => p.dealId === dealId),
      getParticipation: (dealId) =>
        get().participations.find((p) => p.dealId === dealId),
      setParticipationStatus: (dealId, status) =>
        set((state) => ({
          participations: state.participations.map((p) =>
            p.dealId === dealId ? { ...p, status } : p
          ),
        })),
      markGroupBuysViewed: () =>
        set((state) => ({ lastViewedGroupBuysCount: state.participations.length })),
      markClosedViewed: () =>
        set((state) => ({
          lastViewedClosedCount: state.participations.filter((p) => p.status !== "active").length,
        })),
    }),
    {
      name: "groupal-participations",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// Powers the "My Group Buys" nav badge — how many participations exist
// that the buyer hasn't opened that page to see yet. Call
// useParticipationStore((s) => s.markGroupBuysViewed()) when that page
// mounts to clear it back to 0.
export function useUnseenGroupBuysCount(): number {
  const participations = useParticipationStore((s) => s.participations)
  const lastViewed = useParticipationStore((s) => s.lastViewedGroupBuysCount)
  return Math.max(0, participations.length - lastViewed)
}

// Same badge mechanic for "Purchases" — how many participations have
// closed (left "active") since the buyer last opened that page.
export function useUnseenClosedCount(): number {
  const participations = useParticipationStore((s) => s.participations)
  const lastViewed = useParticipationStore((s) => s.lastViewedClosedCount)
  const closedTotal = participations.filter((p) => p.status !== "active").length
  return Math.max(0, closedTotal - lastViewed)
}
