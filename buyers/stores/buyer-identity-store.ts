"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Tracks which Clerk accounts have ever been signed in on the buyer portal
// (without a seller profile) — the one signal this app needs to answer "is
// this email/Google account already a buyer?" when someone tries to
// register it as a seller too (app/sellers/page.tsx's SellersGatePage).
// Buyers have no explicit registration step of their own, unlike sellers'
// onboarding form, so simply visiting the buyer portal signed in IS that
// account's buyer registration — it does not require liking or joining
// anything first.
//
// Deliberately its own small store, not folded into buyers/stores/
// participation-store.ts or likes-store.ts: those two aren't scoped by
// Clerk user id at all (a known, pre-existing limitation — a flat,
// unscoped array shared by whoever's signed in on this browser, same gap
// documented on seller-deals-store.ts's seller-side equivalent). Properly
// scoping either of those is a bigger change; this store only needs one
// bit of information per user id, so it tracks that directly and
// correctly rather than inheriting the existing gap.
interface BuyerIdentityStore {
  buyerUserIds: Record<string, true>
  markAsBuyer: (userId: string) => void
}

export const useBuyerIdentityStore = create<BuyerIdentityStore>()(
  persist(
    (set) => ({
      buyerUserIds: {},
      markAsBuyer: (userId) =>
        set((state) => ({ buyerUserIds: { ...state.buyerUserIds, [userId]: true } })),
    }),
    { name: "groupal-buyer-identity" }
  )
)

// Primary call site: sellers/components/SellerViewOnlyGuard.tsx, mounted on
// every buyer route for every signed-in visitor without a seller profile —
// this is what makes "just signed up/signed in as a buyer" enough on its
// own. LikeButton.tsx and the checkout page's handleComplete also call it,
// redundantly but harmlessly (the set is idempotent), as a second line of
// defense in case that guard is ever removed or bypassed.
export function useHasBuyerActivity(userId: string | null | undefined): boolean {
  return useBuyerIdentityStore((s) => (userId ? !!s.buyerUserIds[userId] : false))
}
