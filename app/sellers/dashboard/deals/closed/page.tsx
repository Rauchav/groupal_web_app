"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { PackageX, Users, CheckCircle2, ArrowRight } from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"
import { useSellerClosedDeals, useSellerDealsStore } from "@/sellers/stores/seller-deals-store"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"
import { DealReachBadge } from "@/components/deal-reach-badge"

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

export default function SellerClosedDealsPage() {
  const { user } = useUser()
  const profile = useSellerProfile(user?.id)
  const deals = useSellerClosedDeals(profile?.id)
  const markClosedDealsViewed = useSellerDealsStore((s) => s.markClosedDealsViewed)

  // Clears the "Closed Deals" nav badge — the seller has now actually
  // looked at whatever closed since their last visit.
  useEffect(() => {
    if (profile?.id) markClosedDealsViewed(profile.id)
  }, [profile?.id, markClosedDealsViewed])

  return (
    <>
      <div>
        <h1 className="font-heading font-extrabold text-[#002356] text-2xl">Closed Deals</h1>
        <p className="text-gray-500 text-sm mt-1">
          Deals that hit their buyer target or closing date, with final results.
        </p>
      </div>

      {deals.length === 0 ? (
        <SellerComingSoon
          icon={PackageX}
          title="No closed deals yet"
          description="Deals that hit their buyer target or closing date will land here, with final results."
        />
      ) : (
        <div className="space-y-3 mt-6">
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
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#002356] text-sm truncate">{deal.productName}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color: "#048943", backgroundColor: "#04894314" }}>
                      <CheckCircle2 className="h-3 w-3" />
                      Closed
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400 line-through tabular-nums">{fmt(deal.originalPrice)}</span>
                    <span className="text-sm font-extrabold tabular-nums" style={{ color: "#002356" }}>
                      {fmt(computed.currentPrice)}
                    </span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: "#048943" }}>
                      {computed.currentDiscountPercent.toFixed(0)}% final discount
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Users className="h-3 w-3" />
                    {deal.currentBuyerCount} of {deal.maxBuyersRequired} buyers joined
                  </div>
                  {deal.reach && <DealReachBadge reach={deal.reach} className="text-xs text-gray-400 mt-1" />}
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
