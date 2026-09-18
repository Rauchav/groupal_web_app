"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import { motion } from "framer-motion"
import {
  ArrowLeft, MapPin, Truck, ShoppingBag, Clock, ChevronDown, ChevronUp,
  Users, PackageX, Share2, BarChart3,
} from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"
import { useApiGet } from "@/lib/api/use-fetch"
import { apiDealToDeal, type ApiDeal } from "@/lib/api/deal-adapter"
import {
  computeDealValues, computeEstimatedFinalPrice, getDiscountColor, getProgressBarColor,
} from "@/lib/utils/deal-calculator"
import { CountdownTimer } from "@/buyers/components/marketplace/CountdownTimer"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"
import { ShareDealModal } from "@/sellers/components/ShareDealModal"
import { DealReachBadge } from "@/components/deal-reach-badge"
import { cn } from "@/lib/utils"
import type { Participation } from "@/lib/types/payment"

// The seller-only counterpart to app/(buyers)/checkout/[dealId]/page.tsx's
// "Review Deal" step — same product gallery/pricing visual language, but
// with every buyer-facing CTA (reserve a spot, pay today, share this deal)
// replaced by the thing a seller actually wants to see here: who's in the
// group. This is also where Active/Closed Deals cards and the
// post-publish "See it live" flow now point, instead of sending a seller
// into their own deal's buyer checkout page.

function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)
}
function fmtShort(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
}

// Deliberately duplicated, not imported, from buyers/components/dashboard/
// DealPaymentSummary.tsx's CTA_BUTTON_CLASS (gold fill / navy border /
// navy text / soft navy drop shadow) — same "Share this deal" look the
// user pointed to on the buyer marketplace cards, kept as its own copy
// here rather than a cross-portal import, per this app's buyer/seller
// component-tree separation (see sellers/components/SellerNavbar.tsx's
// own note on why that split is deliberate).
const SHARE_BUTTON_CLASS =
  "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-extrabold transition-transform duration-150 cursor-pointer text-[#002356] border-[3px] border-[#002356] shadow-[0_4px_4px_rgba(0,35,86,0.4)] hover:scale-[1.01]"

// Statuses that still count as "in the group" — a forfeited/refunded spot
// has already been released back to the deal (releaseDealSpot in
// lib/mock/deals.ts) and shouldn't be listed as if the buyer were still in.
const CURRENTLY_JOINED = new Set([
  "RESERVATION_PAID", "AWAITING_FINAL_PAYMENT", "FINAL_PAYMENT_PAID", "PAYMENT_FAILED", "IN_GRACE_PERIOD",
])

function BuyerAvatar({ p, size = 36 }: { p: Participation; size?: number }) {
  const name = p.buyerName ?? "A Groupal buyer"
  return p.buyerAvatarUrl ? (
    <div
      className="relative rounded-full overflow-hidden border-2 border-white bg-gray-100 flex-shrink-0"
      style={{ height: size, width: size }}
    >
      <Image src={p.buyerAvatarUrl} alt={name} fill className="object-cover" sizes={`${size}px`} />
    </div>
  ) : (
    <div
      className="rounded-full border-2 border-white bg-[#1b4487] text-white font-bold flex items-center justify-center flex-shrink-0"
      style={{ height: size, width: size, fontSize: size * 0.4 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  )
}

export default function SellerDealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const profile = useSellerProfile(user?.id)
  const { data: dealData, loading: dealLoading } = useApiGet<{ deal: ApiDeal }>(`/api/deals/${id}`)
  const fetchedDeal = dealData ? apiDealToDeal(dealData.deal) : null
  // Ownership check against the real Clerk id (sellerUserId, via the
  // seller relation) rather than the local zustand seller-store's id,
  // which no longer matches a deal created through the real API.
  const deal = fetchedDeal && fetchedDeal.sellerUserId === user?.id ? fetchedDeal : null

  const { data: participantsData } = useApiGet<{ participations: (Omit<Participation, "createdAt" | "updatedAt" | "graceDeadline"> & { createdAt: string })[] }>(
    deal ? `/api/deals/${deal.id}/participants` : null
  )
  const participations: Participation[] = (participantsData?.participations ?? []).map((p) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.createdAt),
  }))
  const [buyersExpanded, setBuyersExpanded] = useState(false)
  const [selectedImgIdx, setSelectedImgIdx] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)

  if (!deal) {
    if (dealLoading) return null
    return (
      <SellerComingSoon
        icon={PackageX}
        title="Deal not found"
        description="This deal doesn't exist, or isn't one of yours."
      />
    )
  }

  const computed = computeDealValues(deal)
  const galleryImages = deal.productImages
  const buyers = participations
    .filter((p) => CURRENTLY_JOINED.has(p.status))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <>
      <Link
        href="/sellers/dashboard/deals"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#002356] transition-colors font-medium mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Active Deals
      </Link>

      <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-8 lg:items-start">

        {/* Mobile/tablet: horizontal image slider */}
        <div className="lg:hidden -mx-4 mb-5">
          <div className="flex gap-3 overflow-x-auto px-4 pb-3 snap-x snap-mandatory">
            {galleryImages.map((img, i) => (
              <div key={i} className="relative h-64 w-[85vw] flex-shrink-0 rounded-2xl overflow-hidden snap-start">
                <Image src={img} alt={`${deal.productName} view ${i + 1}`} fill className="object-cover" sizes="85vw" />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop gallery */}
        <div className="hidden lg:flex lg:flex-col lg:sticky lg:top-24 gap-3">
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden">
            <Image
              src={galleryImages[selectedImgIdx]}
              alt={deal.productName}
              fill
              className="object-cover transition-all duration-300"
              sizes="420px"
            />
          </div>
          {galleryImages.length > 1 && (
            <div className="flex gap-2">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImgIdx(i)}
                  className={cn(
                    "relative h-20 w-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-150",
                    selectedImgIdx === i ? "border-[#002356] scale-95" : "border-gray-200 hover:border-gray-400"
                  )}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        {/* min-w-0: without it, a CSS grid item defaults to min-width:auto,
            so a wide-enough child (the expanded buyer list below, before its
            own min-w-0/grid fix) could force this whole column — and the
            fixed lg:grid-cols-[2fr_3fr] track it sits in — to grow past its
            intended width instead of clipping/wrapping its content. */}
        <div className="space-y-4 min-w-0">

          {/* White info card */}
          <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#002356]/10 text-[#002356]">
                {deal.category}
              </span>
              <span
                className={cn(
                  "inline-block px-2.5 py-1 rounded-full text-xs font-bold",
                  deal.status === "active" ? "bg-[#048943]/10 text-[#048943]" : "bg-gray-100 text-gray-500"
                )}
              >
                {deal.status === "active" ? "Active" : "Closed"}
              </span>
            </div>

            <h1 className="font-bold text-[#002356] text-xl leading-snug">{deal.productName}</h1>

            {deal.reach && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DealReachBadge reach={deal.reach} className="text-gray-600" />
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              {deal.isPickup ? (
                <>
                  <ShoppingBag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>Pick up in store</span>
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    Delivery:{" "}
                    <span className="font-semibold text-gray-800">
                      {deal.deliveryZones && deal.deliveryZones.length > 0
                        ? `from ${fmt(Math.min(...deal.deliveryZones.map((z) => z.price)))}`
                        : fmt(9.99)}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Navy pricing card */}
          <div className="w-full rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: "#002356" }}>
            <div className="px-6 py-5 space-y-5">

              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-white/50 text-xs font-extrabold uppercase tracking-widest mb-1">
                    Regular Store Price
                  </p>
                  <span
                    className="font-bold text-white/60 tabular-nums line-through leading-none"
                    style={{ fontSize: "1.5rem" }}
                  >
                    {fmtShort(deal.originalPrice, deal.currency)}
                  </span>
                </div>
                <div>
                  <p className="font-heading font-extrabold leading-none mb-1 text-white">
                    Current grou<span className="text-groupal-gold">pal</span> price
                  </p>
                  <p className="font-extrabold text-white tabular-nums leading-none" style={{ fontSize: "3rem" }}>
                    {fmtShort(computed.currentPrice, deal.currency)}
                  </p>
                </div>
              </div>

              {/* Milestone pills */}
              <div className="flex items-center gap-3 flex-wrap">
                {deal.milestones.map((m, i) => {
                  const tagColor = i === 0
                    ? "bg-groupal-gold text-groupal-navy"
                    : i === 1
                    ? "bg-groupal-orange text-white"
                    : "bg-groupal-red text-white"
                  return (
                    <span key={i} className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                      {m.buyerCount} buyers →
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-bold", tagColor)}>
                        {m.discountPercent}% off
                      </span>
                    </span>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                  <motion.div
                    className={cn("h-full rounded-full", getProgressBarColor(computed.progressPercent))}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(computed.progressPercent, 100)}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                </div>
                <p className="text-white/60 text-xs">
                  Every new buyer adds{" "}
                  <span className="font-extrabold text-white">{computed.discountPerBuyer.toFixed(2)}%</span>{" "}
                  more discount for everyone in the group
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white">
                  Right now, <span className="font-bold" style={{ color: "#eaad00" }}>{deal.currentBuyerCount}</span> of{" "}
                  <span className="font-bold" style={{ color: "#eaad00" }}>{deal.maxBuyersRequired}</span> buyers joined
                </span>
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums flex-shrink-0"
                  style={{
                    backgroundColor: getDiscountColor(computed.progressPercent),
                    color: computed.progressPercent < 25 ? "#ffffff" : "#002356",
                  }}
                >
                  {computed.currentDiscountPercent.toFixed(1)}% off
                </span>
              </div>

              {/* Buyers — who's actually in the group */}
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => setBuyersExpanded((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {buyers.length > 0 ? (
                      <div className="flex -space-x-2">
                        {buyers.slice(0, 6).map((p) => <BuyerAvatar key={p.id} p={p} />)}
                        {buyers.length > 6 && (
                          <div className="h-9 w-9 rounded-full border-2 border-[#002356] bg-white/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            +{buyers.length - 6}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Users className="h-6 w-6 text-white/30" />
                    )}
                    <span className="font-bold text-white text-sm">
                      {buyers.length} buyer{buyers.length === 1 ? "" : "s"} joined in
                    </span>
                  </div>
                  {buyersExpanded
                    ? <ChevronUp className="h-4 w-4 text-white/50 flex-shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-white/50 flex-shrink-0" />}
                </button>

                {buyersExpanded && (
                  <div className="mt-4 space-y-2.5">
                    {buyers.length === 0 ? (
                      <p className="text-sm text-white/50 text-center py-4">No buyers have joined yet.</p>
                    ) : (
                      buyers.map((p) => {
                        const remaining = computeEstimatedFinalPrice(deal, p.deliveryCost)
                        return (
                          <div
                            key={p.id}
                            className="flex flex-col gap-3 p-3 rounded-xl min-w-0"
                            style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <BuyerAvatar p={p} size={40} />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-white truncate">
                                  {p.buyerName ?? "A Groupal buyer"}
                                </p>
                                {p.deliveryAddress?.city && (
                                  <p className="text-xs text-white/50 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {p.deliveryAddress.city}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* A fixed 3-column grid instead of a flex-nowrap
                                row: each cell is only ever a third of this
                                card's own width, so a wide value (like the
                                joined date/time below, no longer forced onto
                                one line) wraps inside its cell instead of
                                pushing the card wider. */}
                            <div className="grid grid-cols-3 gap-2 pl-[52px]">
                              <div className="min-w-0">
                                <p className="text-[10px] text-white/50 uppercase tracking-wide">Paid upfront</p>
                                <p className="text-sm font-bold tabular-nums" style={{ color: "#eaad00" }}>
                                  {fmt(p.reservationAmount, deal.currency)}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] text-white/50 uppercase tracking-wide">If closed now</p>
                                <p className="text-sm font-bold tabular-nums" style={{ color: "#eaad00" }}>
                                  {fmt(remaining, deal.currency)}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] text-white/50 uppercase tracking-wide">Joined</p>
                                <p className="text-xs text-white/70">
                                  {format(p.createdAt, "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Clock className="h-4 w-4" />
                  <span style={{ color: "white", fontWeight: "bold" }}>
                    {deal.status === "active" ? "Deal ends in:" : "Group buy deal closed"}
                  </span>
                </div>
                {deal.status === "active" && <CountdownTimer targetDate={deal.deadlineAt} />}
              </div>

              <div className="pt-2 border-t border-white/10">
                {deal.status === "active" ? (
                  <button onClick={() => setShareOpen(true)} className={SHARE_BUTTON_CLASS} style={{ backgroundColor: "#eaad00" }}>
                    <Share2 className="h-4 w-4" style={{ color: "#002356" }} />
                    Share this deal
                  </button>
                ) : (
                  <Link href="/sellers/dashboard/reports" className={SHARE_BUTTON_CLASS} style={{ backgroundColor: "#eaad00" }}>
                    <BarChart3 className="h-4 w-4" style={{ color: "#002356" }} />
                    Review my sales reports
                  </Link>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <ShareDealModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        dealId={deal.id}
        dealTitle={deal.productName}
      />
    </>
  )
}
