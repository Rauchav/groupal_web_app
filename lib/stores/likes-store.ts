"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface LikesStore {
  likedDealIds: string[]
  // True once this store's persisted state has been read back from
  // localStorage on the client. Always false during SSR (localStorage
  // doesn't exist there) and for the first client render, so components
  // can avoid branching on likedDealIds before then — otherwise the
  // client's first paint diverges from the server-rendered HTML and React
  // throws a hydration mismatch.
  hasHydrated: boolean
  setHasHydrated: (hasHydrated: boolean) => void
  toggleLike: (dealId: string) => void
  isLiked: (dealId: string) => boolean
  setLikedDeals: (dealIds: string[]) => void
}

export const useLikesStore = create<LikesStore>()(
  persist(
    (set, get) => ({
      likedDealIds: [],
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      toggleLike: (dealId: string) => {
        const current = get().likedDealIds
        const isAlreadyLiked = current.includes(dealId)
        set({
          likedDealIds: isAlreadyLiked
            ? current.filter((id) => id !== dealId)
            : [...current, dealId],
        })
      },
      isLiked: (dealId: string) => get().likedDealIds.includes(dealId),
      setLikedDeals: (dealIds: string[]) => set({ likedDealIds: dealIds }),
    }),
    {
      name: "groupal-likes",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
