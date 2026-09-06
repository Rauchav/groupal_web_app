"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { DealCard } from "@/buyers/components/marketplace/DealCard"
import { DashboardSidebar, DashboardMobileTabs } from "@/buyers/components/dashboard/DashboardNav"
import { MOCK_DEALS } from "@/lib/mock/deals"
import { useLikesStore } from "@/buyers/stores/likes-store"

export default function LikedDealsPage() {
  // Gate on hasHydrated so the first client render matches the server's
  // always-empty SSR state — otherwise the real (persisted) list vs. the
  // empty state below diverge and React throws a hydration mismatch.
  const hasHydrated = useLikesStore((s) => s.hasHydrated)
  const likedDealIdsStore = useLikesStore((s) => s.likedDealIds)
  const likedDealIds = hasHydrated ? likedDealIdsStore : []
  const likedDeals = MOCK_DEALS.filter((d) => likedDealIds.includes(d.id))

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f8f9fa", paddingTop: "7.5rem", paddingBottom: "4rem" }}>
      <div className="max-w-[1100px] mx-auto px-4">
        <DashboardMobileTabs active="/dashboard/liked" />

        <div className="flex gap-6">
          <DashboardSidebar active="/dashboard/liked" />

          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-[#002356] text-2xl">
                Liked Deals
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Your saved group buys — {likedDeals.length} deal{likedDeals.length !== 1 ? "s" : ""}.
              </p>
            </div>

            {likedDeals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="flex justify-center mb-4">
                  <Heart className="h-14 w-14 text-gray-200" />
                </div>
                <h3 className="font-bold text-gray-700 text-lg mb-1">No liked deals yet</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Click the heart on any deal to save it here for quick access.
                </p>
                <Link
                  href="/deals"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ backgroundColor: "#002356" }}
                >
                  Browse Deals
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {likedDeals.map((deal) => (
                  <a key={deal.id} href={`/checkout/${deal.id}`} className="block h-full">
                    <DealCard
                      deal={deal}
                      onJoin={() => window.location.href = `/checkout/${deal.id}`}
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
