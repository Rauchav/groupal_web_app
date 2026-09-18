"use client"

import { useEffect } from "react"
import { create } from "zustand"
import { useUser } from "@clerk/nextjs"
import type { Deal } from "@/lib/types/deal"
import { apiDealToDeal, type ApiDeal } from "@/lib/api/deal-adapter"
import { useBadgesStore } from "@/lib/dashboard/badges-store"

// The richer engine status (GroupBuyParticipation.status, straight from
// Prisma) collapses onto this simpler three-state model for the dashboard/
// purchases UI — AWAITING_FINAL_PAYMENT / PAYMENT_FAILED / IN_GRACE_PERIOD
// all stay "active", since the buyer sees what's actually happening via
// the notifications those states already create, not a second copy of
// this status machine here.
export type SimpleStatus = "active" | "completed" | "forfeited"

function toSimpleStatus(status: string): SimpleStatus {
  if (status === "FINAL_PAYMENT_PAID") return "completed"
  if (status === "FORFEITED" || status === "REFUNDED") return "forfeited"
  return "active"
}

export interface MockParticipation {
  id: string
  dealId: string
  deal: Deal
  joinedAt: string
  reservationPaid: number
  deliveryCost: number
  status: SimpleStatus
  deliveryAddress: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
}

interface ApiParticipation {
  id: string
  dealId: string
  deal: ApiDeal
  createdAt: string
  reservationAmount: number
  deliveryCost: number
  status: string
  deliveryAddress: { street: string; city: string; state: string; country: string; zipCode?: string } | null
}

function toMockParticipation(p: ApiParticipation): MockParticipation {
  return {
    id: p.id,
    dealId: p.dealId,
    deal: apiDealToDeal(p.deal),
    joinedAt: p.createdAt,
    reservationPaid: p.reservationAmount,
    deliveryCost: p.deliveryCost,
    status: toSimpleStatus(p.status),
    deliveryAddress: {
      street: p.deliveryAddress?.street ?? "",
      city: p.deliveryAddress?.city ?? "",
      state: p.deliveryAddress?.state ?? "",
      country: p.deliveryAddress?.country ?? "",
      zipCode: p.deliveryAddress?.zipCode ?? "",
    },
  }
}

interface ParticipationStore {
  participations: MockParticipation[]
  // True once the initial GET /api/participations fetch has resolved.
  // Components avoid branching on `participations` before then, same
  // reasoning the old localStorage-hydration gate had (SSR/first-paint
  // shouldn't diverge from what's about to load).
  hasHydrated: boolean
  loading: boolean
  refresh: () => Promise<void>
  hasJoined: (dealId: string) => boolean
  getParticipation: (dealId: string) => MockParticipation | undefined
  markGroupBuysViewed: () => void
  markClosedViewed: () => void
}

export const useParticipationStore = create<ParticipationStore>((set, get) => ({
  participations: [],
  hasHydrated: false,
  loading: false,
  async refresh() {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await fetch("/api/participations")
      if (res.ok) {
        const { participations } = await res.json()
        set({ participations: (participations as ApiParticipation[]).map(toMockParticipation), hasHydrated: true })
      }
    } finally {
      set({ loading: false })
    }
  },
  hasJoined: (dealId) => get().participations.some((p) => p.dealId === dealId),
  getParticipation: (dealId) => get().participations.find((p) => p.dealId === dealId),
  markGroupBuysViewed: () => void useBadgesStore.getState().markViewed("groupBuys"),
  markClosedViewed: () => void useBadgesStore.getState().markViewed("purchases"),
}))

// Triggers the initial fetch the first time any consumer needs it — every
// page/component below just calls this and then reads hasJoined/
// participations normally.
export function useEnsureParticipationsLoaded(userId: string | null | undefined) {
  const hasHydrated = useParticipationStore((s) => s.hasHydrated)
  const refresh = useParticipationStore((s) => s.refresh)
  useEffect(() => {
    if (userId && !hasHydrated) void refresh()
  }, [userId, hasHydrated, refresh])
}

// Powers the "My Group Buys" nav badge.
export function useUnseenGroupBuysCount(): number {
  useEnsureBadgesLoadedInternal()
  return useBadgesStore((s) => s.groupBuys)
}

// Same badge mechanic for "Purchases".
export function useUnseenClosedCount(): number {
  useEnsureBadgesLoadedInternal()
  return useBadgesStore((s) => s.purchases)
}

// DashboardNav.tsx's useDashboardBadgeCounts() already calls useUser()
// itself, but these two hooks need userId too to trigger the fetch — reads
// it fresh here rather than requiring every call site to pass it in,
// preserving the original (no-argument) call signature.
function useEnsureBadgesLoadedInternal() {
  const { user } = useUser()
  const loaded = useBadgesStore((s) => s.loaded)
  const refresh = useBadgesStore((s) => s.refresh)
  useEffect(() => {
    if (user?.id && !loaded) void refresh()
  }, [user?.id, loaded, refresh])
}
