"use client"

import { useEffect } from "react"
import { create } from "zustand"

// Backs the "My Group Buys" / "Purchases" nav badges (buyers/components/
// dashboard/DashboardNav.tsx) — a small in-memory cache of GET
// /api/dashboard/badges, fetched once per session rather than once per
// hook call (DashboardSidebar and DashboardMobileTabs both mount on every
// dashboard page and both need these same two numbers).
interface BadgesState {
  groupBuys: number
  purchases: number
  loaded: boolean
  loading: boolean
  refresh: () => Promise<void>
  markViewed: (which: "groupBuys" | "purchases") => Promise<void>
}

export const useBadgesStore = create<BadgesState>((set, get) => ({
  groupBuys: 0,
  purchases: 0,
  loaded: false,
  loading: false,
  async refresh() {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await fetch("/api/dashboard/badges")
      if (res.ok) {
        const data = await res.json()
        set({ groupBuys: data.groupBuys, purchases: data.purchases, loaded: true })
      }
    } finally {
      set({ loading: false })
    }
  },
  async markViewed(which) {
    set({ [which]: 0 })
    await fetch("/api/dashboard/badges/mark-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ which }),
    }).catch(() => {})
  },
}))

// Triggers the initial fetch the first time any consumer needs these
// counts — subsequent mounts just read the already-loaded cache.
export function useEnsureBadgesLoaded(userId: string | null | undefined) {
  const loaded = useBadgesStore((s) => s.loaded)
  const refresh = useBadgesStore((s) => s.refresh)
  useEffect(() => {
    if (userId && !loaded) void refresh()
  }, [userId, loaded, refresh])
}
