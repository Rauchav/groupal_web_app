"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface MockParticipation {
  id: string
  dealId: string
  joinedAt: string
  reservationPaid: number
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
  setHasHydrated: (hasHydrated: boolean) => void
  addParticipation: (p: MockParticipation) => void
  hasJoined: (dealId: string) => boolean
  getParticipation: (dealId: string) => MockParticipation | undefined
  // Bridges the deal-close job's outcome (lib/jobs/deal-close-job.ts, which
  // operates on the richer payments engine) back onto this simpler store,
  // which is what the dashboard/purchases UI actually reads.
  setParticipationStatus: (dealId: string, status: MockParticipation["status"]) => void
}

export const useParticipationStore = create<ParticipationStore>()(
  persist(
    (set, get) => ({
      participations: [],
      hasHydrated: false,
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
    }),
    {
      name: "groupal-participations",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
