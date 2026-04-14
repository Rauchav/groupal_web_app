"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface MockParticipation {
  id: string
  dealId: string
  joinedAt: string
  reservationPaid: number
  platformFee: number
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
  addParticipation: (p: MockParticipation) => void
  hasJoined: (dealId: string) => boolean
  getParticipation: (dealId: string) => MockParticipation | undefined
}

export const useParticipationStore = create<ParticipationStore>()(
  persist(
    (set, get) => ({
      participations: [],
      addParticipation: (p) =>
        set((state) => ({
          participations: [...state.participations, p],
        })),
      hasJoined: (dealId) =>
        get().participations.some((p) => p.dealId === dealId),
      getParticipation: (dealId) =>
        get().participations.find((p) => p.dealId === dealId),
    }),
    { name: "groupal-participations" }
  )
)
