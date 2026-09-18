"use client"

import { useEffect } from "react"
import { create } from "zustand"

// In-memory (not persisted) cache of the signed-in buyer's liked deal ids,
// backed by GET/POST /api/likes* — real-DB replacement for the old
// localStorage store. Same public shape (hasHydrated/likedDealIds/
// toggleLike/isLiked/setLikedDeals) as before, so DealCard/LikeButton/
// Navbar/the Liked Deals page didn't need to change at all, only this
// file's internals.
interface LikesStore {
  likedDealIds: string[]
  hasHydrated: boolean
  loading: boolean
  refresh: () => Promise<void>
  toggleLike: (dealId: string) => void
  isLiked: (dealId: string) => boolean
  setLikedDeals: (dealIds: string[]) => void
}

export const useLikesStore = create<LikesStore>((set, get) => ({
  likedDealIds: [],
  hasHydrated: false,
  loading: false,
  async refresh() {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await fetch("/api/likes")
      if (res.ok) {
        const { dealIds } = await res.json()
        set({ likedDealIds: dealIds, hasHydrated: true })
      }
    } finally {
      set({ loading: false })
    }
  },
  toggleLike: (dealId) => {
    const current = get().likedDealIds
    const isAlreadyLiked = current.includes(dealId)
    // Optimistic — flips immediately, then fires the real toggle. A
    // failure just leaves the UI one toggle ahead of the DB until the next
    // refresh(); low-stakes enough (a heart icon) not to warrant a
    // rollback-on-error dance.
    set({
      likedDealIds: isAlreadyLiked ? current.filter((id) => id !== dealId) : [...current, dealId],
    })
    fetch(`/api/deals/${dealId}/like`, { method: "POST" }).catch(() => {})
  },
  isLiked: (dealId) => get().likedDealIds.includes(dealId),
  setLikedDeals: (dealIds) => set({ likedDealIds: dealIds }),
}))

// Triggers the initial fetch the first time any consumer needs it.
export function useEnsureLikesLoaded(userId: string | null | undefined) {
  const hasHydrated = useLikesStore((s) => s.hasHydrated)
  const refresh = useLikesStore((s) => s.refresh)
  useEffect(() => {
    if (userId && !hasHydrated) void refresh()
  }, [userId, hasHydrated, refresh])
}
