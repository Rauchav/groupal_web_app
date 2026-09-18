"use client"

import { useEffect } from "react"
import { create } from "zustand"

// Backs the "Active Deals" / "Closed Deals" nav badges (sellers/components/
// SellerDashboardNav.tsx) — a small in-memory cache of GET
// /api/sellers/badges, fetched once per session rather than once per hook
// call (the desktop sidebar and mobile tab strip both mount at once and
// both need these same two numbers). Real-DB replacement for
// sellers/stores/seller-deals-store.ts's badge counts, which had been
// silently dead since deal creation moved to the real API.
interface SellerBadgesState {
  active: number
  closed: number
  loaded: boolean
  loading: boolean
  refresh: () => Promise<void>
  markViewed: (which: "active" | "closed") => Promise<void>
}

export const useSellerBadgesStore = create<SellerBadgesState>((set, get) => ({
  active: 0,
  closed: 0,
  loaded: false,
  loading: false,
  async refresh() {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await fetch("/api/sellers/badges")
      if (res.ok) {
        const data = await res.json()
        set({ active: data.active, closed: data.closed, loaded: true })
      }
    } finally {
      set({ loading: false })
    }
  },
  async markViewed(which) {
    set({ [which]: 0 })
    await fetch("/api/sellers/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ which }),
    }).catch(() => {})
  },
}))

function useEnsureSellerBadgesLoaded(userId: string | null | undefined) {
  const loaded = useSellerBadgesStore((s) => s.loaded)
  const refresh = useSellerBadgesStore((s) => s.refresh)
  useEffect(() => {
    if (userId && !loaded) void refresh()
  }, [userId, loaded, refresh])
}

// Powers the "Active Deals" nav badge.
export function useUnseenDealsCount(userId: string | null | undefined): number {
  useEnsureSellerBadgesLoaded(userId)
  return useSellerBadgesStore((s) => s.active)
}

// Same badge mechanic for "Closed Deals".
export function useUnseenClosedDealsCount(userId: string | null | undefined): number {
  useEnsureSellerBadgesLoaded(userId)
  return useSellerBadgesStore((s) => s.closed)
}
