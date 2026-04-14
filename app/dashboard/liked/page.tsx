"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { DealCard } from "@/components/marketplace/DealCard"
import { LikeButton } from "@/components/marketplace/LikeButton"
import { MOCK_DEALS } from "@/lib/mock/deals"
import { useLikesStore } from "@/lib/stores/likes-store"

export default function LikedDealsPage() {
  const { likedDealIds } = useLikesStore()
  const likedDeals = MOCK_DEALS.filter((d) => likedDealIds.includes(d.id))

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">

        {/* Header */}
        <div style={{ backgroundColor: "#002356" }} className="pt-28 pb-10 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Heart className="h-7 w-7 text-red-400" fill="currentColor" />
              <h1 className="font-heading font-extrabold text-white text-3xl">
                Liked Deals
              </h1>
            </div>
            <p className="mt-2 text-white/50 text-sm">
              Your saved group buys — {likedDeals.length} deal{likedDeals.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {likedDeals.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Heart className="h-16 w-16 text-gray-200" />
              <h3 className="text-xl font-bold text-gray-600">No liked deals yet</h3>
              <p className="text-gray-400 text-sm text-center max-w-xs">
                Click the heart on any deal to save it here for quick access
              </p>
              <Link
                href="/deals"
                className="mt-2 px-6 py-3 rounded-xl bg-[#002356] text-white text-sm font-semibold hover:bg-[#1b4487] transition-colors"
              >
                Browse deals
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedDeals.map((deal) => (
                <div key={deal.id} className="relative">
                  <a href={`/deals/${deal.id}`} className="block h-full">
                    <DealCard
                      deal={deal}
                      onJoin={() => window.location.href = `/deals/${deal.id}`}
                    />
                  </a>
                  <div className="absolute top-3 right-3 z-20">
                    <LikeButton dealId={deal.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
