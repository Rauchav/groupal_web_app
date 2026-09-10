"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Deal } from "@/lib/types/deal"
import { addMockDeal } from "@/lib/mock/deals"
import { paymentsDb } from "@/lib/mock/payments-db"
import { sellerDealPublishedCopy } from "@/lib/notifications/copy"

// Durable record of every deal a seller has created, so they survive a
// reload — same zustand + persist + hasHydrated pattern as
// sellers/stores/seller-store.ts and every buyer store in buyers/stores/.
//
// The deal objects themselves also need to land in the shared MOCK_DEALS
// array (see lib/mock/deals.ts) — that's what makes a seller-created deal
// show up in the buyer marketplace and go through the real checkout/
// reservation flow with zero changes to any buyer-side code. `addDeal`
// does that immediately, since it only ever runs from a real user action
// (submitting the create-deal form), never during render. Rehydrated
// deals are different: sellers/components/SellerViewOnlyGuard.tsx pushes
// those into MOCK_DEALS itself, from a useEffect gated on a plain
// useState "mounted" flag (not on hasHydrated below) — zustand's persist
// middleware rehydrates from localStorage SYNCHRONOUSLY (its `toThenable`
// helper skips microtask deferral entirely for synchronous storages like
// localStorage), so hasHydrated can already be true on the very first
// client render, before React has even started reconciling against the
// server-rendered HTML. Mutating MOCK_DEALS from onRehydrateStorage (or
// from anything gated on hasHydrated) can therefore land inside that
// first render, which produces a "Text content does not match" hydration
// error for anything whose count/text depends on MOCK_DEALS — e.g. the
// "N active deals right now" badge on app/(buyers)/deals/page.tsx, which
// also carries a suppressHydrationWarning as a second line of defense.
//
// localStorage only stores JSON — persisting a Deal serializes its Date
// fields (deadlineAt, createdAt) to ISO strings, and zustand's persist
// middleware doesn't revive them back into Date instances on rehydration.
// Every buyer page that calls .getTime() on deadlineAt (e.g. the "ending
// soon" sort on app/(buyers)/deals/page.tsx, which runs by default) throws
// on a rehydrated deal that still has string dates, silently breaking that
// page's deals list. Rehydrated deals need this before they're usable.
function reviveDeal(deal: Deal): Deal {
  return { ...deal, deadlineAt: new Date(deal.deadlineAt), createdAt: new Date(deal.createdAt) }
}

interface SellerDealsStore {
  deals: Deal[]
  hasHydrated: boolean
  // How many of this seller's deals they'd already seen the last time
  // they opened Active Deals — the badge in SellerDashboardNav.tsx shows
  // deals.length - lastViewedCounts[sellerId], so it's a plain unread
  // count rather than a per-deal "seen" flag.
  lastViewedCounts: Record<string, number>
  // Same idea, for how many of this seller's CLOSED deals they'd already
  // seen the last time they opened Closed Deals. A deal's status only
  // ever moves active -> completed in this app (see
  // lib/payments/sync-deal-closures.ts — there's no "reopen"), so this
  // count only ever grows, same monotonic-total assumption as above.
  lastViewedClosedCounts: Record<string, number>
  setHasHydrated: (hasHydrated: boolean) => void
  addDeal: (deal: Deal) => void
  markDealsViewed: (sellerId: string) => void
  markClosedDealsViewed: (sellerId: string) => void
}

export const useSellerDealsStore = create<SellerDealsStore>()(
  persist(
    (set, get) => ({
      deals: [],
      hasHydrated: false,
      lastViewedCounts: {},
      lastViewedClosedCounts: {},
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      addDeal: (deal) => {
        addMockDeal(deal)
        paymentsDb.createNotification({
          userId: deal.sellerUserId,
          ...sellerDealPublishedCopy({ productName: deal.productName }),
          data: { dealId: deal.id },
        })
        set((state) => ({ deals: [...state.deals, deal] }))
      },
      markDealsViewed: (sellerId) => {
        const total = get().deals.filter((d) => d.sellerId === sellerId).length
        set((state) => ({ lastViewedCounts: { ...state.lastViewedCounts, [sellerId]: total } }))
      },
      markClosedDealsViewed: (sellerId) => {
        const total = get().deals.filter((d) => d.sellerId === sellerId && d.status === "completed").length
        set((state) => ({ lastViewedClosedCounts: { ...state.lastViewedClosedCounts, [sellerId]: total } }))
      },
    }),
    {
      name: "groupal-seller-deals",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.deals = state.deals.map(reviveDeal)
        }
        state?.setHasHydrated(true)
      },
    }
  )
)

// Forces zustand's persist middleware to re-serialize `deals` to
// localStorage, picking up in-place mutations made directly on Deal
// objects elsewhere — deal.currentBuyerCount++ (lib/payments/
// reservation-service.ts and releaseDealSpot() in lib/mock/deals.ts),
// deal.status = "completed" and deal.endingSoonNotified = true (both in
// lib/payments/sync-deal-closures.ts's closeExpiredDeals()). Those
// mutations land on the SAME object references sitting in this store's
// `deals` array (shared via addDeal's original push, or SellerViewOnlyGuard/
// SellerNavbar's re-sync into MOCK_DEALS on each fresh page load), but
// zustand's persist only writes to localStorage on an actual set() call —
// a plain property mutation on an object it happens to be holding is
// invisible to it. Without calling this right after such a mutation, a
// seller-created deal's real progress (buyer count, closed status, etc.)
// silently reverts to whatever was last properly set() the moment the
// page reloads — which, worse, would make the deal look "active" again
// and cause the deal-close job to re-run and re-send every close
// notification (DEAL_COMPLETED, SELLER_DEAL_COMPLETED, the payout
// notifications) on every subsequent page load.
export function persistSellerDealMutations(): void {
  useSellerDealsStore.setState((state) => ({ deals: [...state.deals] }))
}

export function useSellerDeals(sellerId: string | null | undefined): Deal[] {
  const deals = useSellerDealsStore((s) => s.deals)
  if (!sellerId) return []
  return deals.filter((d) => d.sellerId === sellerId).slice().reverse()
}

// The hook the Closed Deals page renders from — this seller's deals that
// have actually closed (status flips to "completed" via
// lib/payments/sync-deal-closures.ts, swept on every seller-portal page
// load by sellers/components/SellerNavbar.tsx), newest-closed first.
export function useSellerClosedDeals(sellerId: string | null | undefined): Deal[] {
  const deals = useSellerDealsStore((s) => s.deals)
  if (!sellerId) return []
  return deals.filter((d) => d.sellerId === sellerId && d.status === "completed").slice().reverse()
}

// Powers the notification badge on the "Active Deals" nav link — how
// many of this seller's deals they haven't opened that page to see yet.
// Call useSellerDealsStore((s) => s.markDealsViewed(sellerId)) when that
// page mounts to clear it back to 0.
export function useUnseenDealsCount(sellerId: string | null | undefined): number {
  const deals = useSellerDealsStore((s) => s.deals)
  const lastViewedCounts = useSellerDealsStore((s) => s.lastViewedCounts)
  if (!sellerId) return 0
  const total = deals.filter((d) => d.sellerId === sellerId).length
  const seen = lastViewedCounts[sellerId] ?? 0
  return Math.max(0, total - seen)
}

// Same badge mechanic as useUnseenDealsCount above, for the "Closed
// Deals" nav link — how many of this seller's deals have closed since
// they last opened that page. Deal closures happen via a status mutation
// on the same object reference already sitting in `deals` (see
// lib/payments/sync-deal-closures.ts's closeExpiredDeals()), not through
// addDeal, so this count is driven purely by re-reading d.status on
// every render rather than by an array-length change — whatever
// triggered this component to re-render (useMockDealsSyncStore's tick,
// bumped by SellerNavbar.tsx after its own sweep) is what makes the
// updated status visible here.
export function useUnseenClosedDealsCount(sellerId: string | null | undefined): number {
  const deals = useSellerDealsStore((s) => s.deals)
  const lastViewedClosedCounts = useSellerDealsStore((s) => s.lastViewedClosedCounts)
  if (!sellerId) return 0
  const total = deals.filter((d) => d.sellerId === sellerId && d.status === "completed").length
  const seen = lastViewedClosedCounts[sellerId] ?? 0
  return Math.max(0, total - seen)
}

// A dedicated, un-persisted counter buyer pages subscribe to so they
// reliably re-render once sellers/components/SellerViewOnlyGuard.tsx has
// pushed rehydrated deals into MOCK_DEALS. hasHydrated above looked like
// the obvious thing to subscribe to instead, but it's a boolean that can
// already be true the very first time a page reads it (see the note above
// on synchronous rehydration) — subscribing to a value that might already
// be at its final state on mount means there's no further "change" event
// left for React to react to, so whether a buyer page ever recomputes its
// deals list came down to an unrelated race with that page's own effects
// (reported as: the same deal shows up on reload sometimes and not
// others). A counter starting at 0 on every fresh module load (this store
// is never persisted) and only ever incrementing is unambiguous — the
// first bump is always a real transition, so the recompute is guaranteed
// rather than lucky. SellerNavbar.tsx also bumps this after its own
// closeExpiredDeals() sweep, so seller-portal pages that read `deals`
// (Active Deals, Closed Deals, and their nav badges) recompute the same
// way once a deal's status flips to "completed".
export const useMockDealsSyncStore = create<{ tick: number; bump: () => void }>((set) => ({
  tick: 0,
  bump: () => set((s) => ({ tick: s.tick + 1 })),
}))
