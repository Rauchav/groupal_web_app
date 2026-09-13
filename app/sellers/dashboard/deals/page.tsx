"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { PackageCheck, PlusCircle, Users, ArrowRight } from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"
import { useSellerDeals, useSellerDealsStore } from "@/sellers/stores/seller-deals-store"
import { computeDealValues, getDiscountColor } from "@/lib/utils/deal-calculator"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"
import { DealReachBadge } from "@/components/deal-reach-badge"

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

export default function SellerActiveDealsPage() {
  const { user } = useUser()
  const profile = useSellerProfile(user?.id)
  const deals = useSellerDeals(profile?.id).filter((d) => d.status === "active")
  const markDealsViewed = useSellerDealsStore((s) => s.markDealsViewed)

  // Clears the "Active Deals" nav badge — the seller has now actually
  // looked at whatever was new.
  useEffect(() => {
    if (profile?.id) markDealsViewed(profile.id)
  }, [profile?.id, markDealsViewed])

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-extrabold text-[#002356] text-2xl">Active Deals</h1>
          <p className="text-gray-500 text-sm mt-1">Your live group buy deals, with real-time buyer progress.</p>
        </div>
        <Link
          href="/sellers/dashboard/deals/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0"
          style={{ backgroundColor: "#048943" }}
        >
          <PlusCircle className="h-4 w-4" />
          New Deal
        </Link>
      </div>

      {deals.length === 0 ? (
        <SellerComingSoon
          icon={PackageCheck}
          title="No active deals yet"
          description="Create your first group buy deal to see live buyer progress here."
        />
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => {
            const computed = computeDealValues(deal)
            return (
              <Link
                key={deal.id}
                href={`/sellers/dashboard/deals/${deal.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 transition-colors"
              >
                <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <Image src={deal.productImages[0]} alt={deal.productName} fill sizes="64px" className="object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#002356] text-sm truncate">{deal.productName}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400 line-through tabular-nums">{fmt(deal.originalPrice)}</span>
                    <span className="text-sm font-extrabold tabular-nums" style={{ color: "#002356" }}>
                      {fmt(computed.currentPrice)}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold tabular-nums"
                      style={{ color: getDiscountColor(computed.progressPercent) }}
                    >
                      <Users className="h-3 w-3" />
                      {deal.currentBuyerCount} of {deal.maxBuyersRequired} buyers
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden max-w-xs">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${computed.progressPercent}%`, backgroundColor: getDiscountColor(computed.progressPercent) }}
                    />
                  </div>
                  {deal.reach && <DealReachBadge reach={deal.reach} className="text-xs text-gray-400 mt-1.5" />}
                </div>

                <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
