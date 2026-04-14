"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ShieldCheck, MapPin, Truck, Store, ExternalLink, Users,
  Clock, Share2, Copy, ChevronDown, ChevronUp, ArrowLeft,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { DealCard } from "@/components/marketplace/DealCard"
import { LikeButton } from "@/components/marketplace/LikeButton"
import { CountdownTimer } from "@/components/marketplace/CountdownTimer"
import { MOCK_DEALS, getMockDealById } from "@/lib/mock/deals"
import {
  computeDealValues,
  getProgressBarColor,
} from "@/lib/utils/deal-calculator"
import { cn } from "@/lib/utils"

function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Milestone table rows for "How it works" section ──────────────────────────
function milestoneTableRows(
  maxBuyers: number,
  maxDiscount: number,
  originalPrice: number
) {
  const dpb = maxDiscount / maxBuyers
  const checkpoints = [1, Math.round(maxBuyers * 0.25), Math.round(maxBuyers * 0.5), maxBuyers]
  return checkpoints.map((count) => {
    const discount = Math.min(count * dpb, maxDiscount)
    const price = originalPrice * (1 - discount / 100)
    return { count, discount: Math.round(discount * 10) / 10, price }
  })
}

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const deal = getMockDealById(params.id)
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)

  if (!deal) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-6xl">😕</p>
          <h1 className="text-2xl font-bold text-gray-700">Deal not found</h1>
          <p className="text-gray-400">This deal may have expired or doesn&apos;t exist.</p>
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-[#002356] text-white font-semibold text-sm hover:bg-[#1b4487] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to deals
          </Link>
        </div>
      </main>
    )
  }

  const computed = computeDealValues(deal)
  const progressBarColor = getProgressBarColor(computed.progressPercent)
  const totalDueAtCheckout = computed.reservationAmount + computed.platformFeeAmount
  const tableRows = milestoneTableRows(deal.maxBuyersRequired, deal.maxDiscountPercent, deal.originalPrice)

  const similarDeals = MOCK_DEALS.filter((d) => d.id !== deal.id).slice(0, 3)

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied!")
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Check out this group buy: ${deal!.productName} — ${window.location.href}`)}`,
      "_blank"
    )
  }

  function shareTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Joining this group buy for ${deal!.productName} at Groupal! ${window.location.href}`)}`,
      "_blank"
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50">

        {/* ── Back link ──────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Link
              href="/deals"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#002356] transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to deals
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* ── Two-column layout ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── LEFT COLUMN ────────────────────────────── */}
            <div className="space-y-5">

              {/* Product image */}
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ paddingBottom: "65%" }}>
                <Image
                  src={deal.productImage}
                  alt={deal.productName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                {/* Like button overlaid on image */}
                <div className="absolute top-4 right-4 z-10">
                  <LikeButton dealId={deal.id} />
                </div>
              </div>

              {/* Product info */}
              <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm border border-gray-100">

                {/* Category badge */}
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#002356]/10 text-[#002356]">
                  {deal.category}
                </span>

                {/* Product name */}
                <h1 className="font-heading font-extrabold text-[#002356] text-2xl leading-snug">
                  {deal.productName}
                </h1>

                {/* Seller */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-500">by {deal.sellerName}</span>
                  {deal.sellerVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1b4487]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified Seller
                    </span>
                  )}
                </div>

                {/* IN STORE PRICE */}
                <a
                  href={deal.sellerUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between w-full rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-400 hover:bg-gray-50 transition-all group"
                >
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                      In Store Price
                    </p>
                    <p className="text-lg font-bold text-gray-400 line-through tabular-nums">
                      {formatPrice(deal.originalPrice, deal.currency)}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </a>

                {/* Region & delivery */}
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>
                      Available in: <span className="font-semibold text-gray-800">{deal.sellerName.split(" ")[0]} Region</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {deal.category === "Travel" || deal.category === "Vacations" ? (
                      <>
                        <Store className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>Pickup / In-person</span>
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>Delivery: <span className="font-semibold text-gray-800">$9.99</span></span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN — Group Buy CTA ───────────── */}
            <div className="space-y-4">
              <div
                className="rounded-2xl overflow-hidden shadow-lg"
                style={{ backgroundColor: "#002356" }}
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-white/10">
                  <p className="font-heading font-extrabold text-2xl leading-none">
                    <span className="text-white">groo</span>
                    <span style={{ color: "#eaad00" }}>pal</span>
                    <span className="text-white"> price</span>
                  </p>
                </div>

                <div className="px-6 py-5 space-y-5">

                  {/* Milestone reference */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {deal.milestones.map((m, i) => (
                      <span
                        key={i}
                        className="text-xs font-semibold text-white/50"
                      >
                        {m.buyerCount} buyers → {m.discountPercent}% off
                        {i < deal.milestones.length - 1 && (
                          <span className="text-white/25 ml-2">|</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          <span className="text-white font-bold">{deal.currentBuyerCount}</span>
                          {" of "}
                          <span className="text-white font-bold">{deal.maxBuyersRequired}</span>
                          {" buyers joined"}
                        </span>
                      </span>
                      <span
                        className="font-bold text-sm"
                        style={{
                          color: computed.progressPercent < 25 ? "#6B7A99"
                            : computed.progressPercent < 50 ? "#eaad00"
                            : computed.progressPercent < 75 ? "#e86300"
                            : "#048943"
                        }}
                      >
                        {computed.currentDiscountPercent.toFixed(1)}% off
                      </span>
                    </div>
                    <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                      <motion.div
                        className={cn("h-full rounded-full", progressBarColor)}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(computed.progressPercent, 100)}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-white/40 text-xs">
                      Every new buyer adds {computed.discountPerBuyer.toFixed(2)}% more discount for everyone
                    </p>
                  </div>

                  {/* Current price — hero */}
                  <div className="space-y-1">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                      Current Group Price
                    </p>
                    <p className="font-heading font-extrabold text-white tabular-nums" style={{ fontSize: "3rem", lineHeight: 1 }}>
                      {formatPrice(computed.currentPrice, deal.currency)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/30 line-through text-sm tabular-nums">
                        {formatPrice(deal.originalPrice, deal.currency)}
                      </span>
                      <span className="text-sm font-bold" style={{ color: "#eaad00" }}>
                        You save {formatPrice(computed.savingsAmount, deal.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Deal ends in:</span>
                    </div>
                    <CountdownTimer targetDate={deal.deadlineAt} />
                    <p className="text-white/30 text-xs">Deal always completes at deadline — your reservation is protected</p>
                  </div>

                  {/* Reservation breakdown */}
                  <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
                      What you pay today (10% reservation)
                    </p>
                    {[
                      { label: "Store price",         value: formatPrice(deal.originalPrice, deal.currency) },
                      { label: "Reservation (10%)",  value: formatPrice(computed.reservationAmount, deal.currency) },
                      { label: "Groupal fee (1.5%)", value: formatPrice(computed.platformFeeAmount, deal.currency) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-white/50">{label}</span>
                        <span className="text-white font-semibold tabular-nums">{value}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                      <span className="text-white font-bold text-sm">Pay today</span>
                      <span className="text-white font-extrabold tabular-nums" style={{ color: "#eaad00" }}>
                        {formatPrice(totalDueAtCheckout, deal.currency)}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                      <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">
                        What you pay when deal closes
                      </p>
                      {[
                        { label: "Remaining (90%)", value: formatPrice(computed.remainingAmount, deal.currency) },
                        { label: "+ Delivery",       value: "$9.99" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between text-sm">
                          <span className="text-white/50">{label}</span>
                          <span className="text-white/70 font-semibold tabular-nums">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => toast.success("Joining group buy... (checkout coming soon)")}
                    className="w-full py-4 rounded-xl font-extrabold text-white text-base cursor-pointer transition-colors"
                    style={{ backgroundColor: "#048943" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#059c4f")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#048943")}
                  >
                    Join Group Buy — Pay {formatPrice(totalDueAtCheckout, deal.currency)} Today
                  </button>
                  <p className="text-center text-white/30 text-xs">
                    Secure payment · Full refund if seller cancels
                  </p>

                  {/* Social share */}
                  <div className="space-y-2">
                    <p className="text-white/50 text-xs text-center font-medium">
                      Share to drop the price for everyone 👥
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={shareWhatsApp}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        WhatsApp
                      </button>
                      <button
                        onClick={shareTwitter}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        X / Twitter
                      </button>
                      <button
                        onClick={copyLink}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* ── How the discount works ─────────────────────── */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setHowItWorksOpen((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span className="font-bold text-[#002356] text-base">How the discount works</span>
              {howItWorksOpen
                ? <ChevronUp className="h-5 w-5 text-gray-400" />
                : <ChevronDown className="h-5 w-5 text-gray-400" />
              }
            </button>

            {howItWorksOpen && (
              <div className="px-6 pb-6 space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  Each buyer who joins adds{" "}
                  <span className="font-semibold text-[#002356]">
                    {computed.discountPerBuyer.toFixed(2)}%
                  </span>{" "}
                  discount for the entire group. The more people join, the better the deal gets
                  for everyone — including you.
                </p>

                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#002356]/5">
                        <th className="px-4 py-2.5 text-left font-semibold text-[#002356]">Buyers</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-[#002356]">Discount</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-[#002356]">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, i) => (
                        <tr
                          key={i}
                          className={cn(
                            "border-t border-gray-100",
                            i === tableRows.length - 1 && "bg-green-50"
                          )}
                        >
                          <td className="px-4 py-2.5 font-medium text-gray-700">{row.count}</td>
                          <td className="px-4 py-2.5 font-semibold" style={{ color: "#e86300" }}>
                            {row.discount}%
                          </td>
                          <td className="px-4 py-2.5 font-bold text-[#002356] tabular-nums">
                            {formatPrice(row.price, deal.currency)}
                            {i === tableRows.length - 1 && (
                              <span className="ml-2 text-xs font-bold text-green-600">← MAX</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Similar deals ─────────────────────────────── */}
          <div className="mt-10">
            <h2 className="font-heading font-extrabold text-[#002356] text-xl mb-5">
              You might also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarDeals.map((d) => (
                <div key={d.id} className="relative">
                  <a href={`/deals/${d.id}`} className="block h-full">
                    <DealCard
                      deal={d}
                      onJoin={() => window.location.href = `/deals/${d.id}`}
                    />
                  </a>
                  <div className="absolute top-3 right-3 z-20">
                    <LikeButton dealId={d.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
