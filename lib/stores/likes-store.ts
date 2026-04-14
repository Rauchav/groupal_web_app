"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface LikesStore {
  likedDealIds: string[]
  toggleLike: (dealId: string) => void
  isLiked: (dealId: string) => boolean
  setLikedDeals: (dealIds: string[]) => void
}

export const useLikesStore = create<LikesStore>()(
  persist(
    (set, get) => ({
      likedDealIds: [],
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
    }
  )
)
