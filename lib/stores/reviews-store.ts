"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { DealReview } from "@/lib/types/review"

interface ReviewsStore {
  reviews: DealReview[]
  // True once this store's persisted state has been read back from
  // localStorage on the client. Always false during SSR (localStorage
  // doesn't exist there) and for the first client render, so components
  // can avoid branching on reviews before then — otherwise the client's
  // first paint diverges from the server-rendered HTML and React throws
  // a hydration mismatch.
  hasHydrated: boolean
  setHasHydrated: (hasHydrated: boolean) => void
  addOrUpdateReview: (review: Omit<DealReview, "id" | "createdAt">) => void
  getReviewForBuyer: (dealId: string, buyerId: string) => DealReview | undefined
  getReviewsForDeal: (dealId: string) => DealReview[]
}

export const useReviewsStore = create<ReviewsStore>()(
  persist(
    (set, get) => ({
      reviews: [],
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      addOrUpdateReview: (review) =>
        set((state) => {
          const existing = state.reviews.find(
            (r) => r.dealId === review.dealId && r.buyerId === review.buyerId
          )
          if (existing) {
            return {
              reviews: state.reviews.map((r) =>
                r.id === existing.id ? { ...r, rating: review.rating, comment: review.comment, buyerName: review.buyerName } : r
              ),
            }
          }
          return {
            reviews: [
              ...state.reviews,
              {
                ...review,
                id: `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        }),
      getReviewForBuyer: (dealId, buyerId) =>
        get().reviews.find((r) => r.dealId === dealId && r.buyerId === buyerId),
      getReviewsForDeal: (dealId) => get().reviews.filter((r) => r.dealId === dealId),
    }),
    {
      name: "groupal-reviews",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
