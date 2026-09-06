"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Share2, Star, Users } from "lucide-react"
import { Deal } from "@/lib/types/deal"
import { computeDealValues, computeEstimatedFinalPrice } from "@/lib/utils/deal-calculator"
import { useReviewsStore } from "@/buyers/stores/reviews-store"
import { ReviewModal } from "@/buyers/components/dashboard/ReviewModal"

const MILESTONE_COLORS = ["#eaad00", "#e86300", "#DA1200"] as const

function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

// Min / mid / max discount milestones for this deal — same scale shown on
// the marketplace deal cards, restyled for a white card background. Placed
// by the caller above the progress bar, not inside the payment summary.
export function MilestoneScale({ deal }: { deal: Deal }) {
  return (
    <div className="flex items-center px-1 py-1">
      {deal.milestones.map((m, i) => (
        <div key={i} className="flex-1 flex items-center justify-center gap-1 min-w-0">
          <span
            className="font-heading font-extrabold tabular-nums leading-none"
            style={{ color: MILESTONE_COLORS[i], fontSize: "0.75rem" }}
          >
            {m.discountPercent}%
          </span>
          <span className="text-gray-300 font-semibold leading-none" style={{ fontSize: "0.65rem" }}>-</span>
          <span className="flex items-center gap-0.5 text-gray-400 font-semibold" style={{ fontSize: "0.65rem" }}>
            {m.buyerCount}
            <Users className="h-2.5 w-2.5" />
          </span>
        </div>
      ))}
    </div>
  )
}

// Shared CTA button style for both cards — gold fill, bold navy border,
// navy text, soft navy drop shadow (matches the Figma spec exactly:
// #eaad00 fill / #002356 4px inside stroke / 0 4 4 #002356 40% shadow).
export const CTA_BUTTON_CLASS =
  "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-extrabold transition-transform duration-150 cursor-pointer text-[#002356] border-[3px] border-[#002356] shadow-[0_4px_4px_rgba(0,35,86,0.4)] hover:scale-[1.01]"

// The full-bleed navy pricing panel shared by the open and closed cards —
// in-store vs group price, the "PAYMENTS" inset card, then a savings
// section. `isClosed` swaps the copy/labels and collapses savings to a
// single final row instead of the open card's current + max-discount rows.
function PricingPanel({
  deal,
  reservationPaid,
  isClosed,
}: {
  deal:             Deal
  reservationPaid:  number
  isClosed:         boolean
}) {
  const computed = computeDealValues(deal)
  const deliveryCost = deal.isPickup ? 0 : 9.99
  const finalPayment = computeEstimatedFinalPrice(deal, deliveryCost)
  const maxDiscountPrice = deal.originalPrice * (1 - deal.maxDiscountPercent / 100)
  const maxSavings = deal.originalPrice - maxDiscountPrice
  const savedAmount = deal.originalPrice - computed.currentPrice

  return (
    <div style={{ backgroundColor: "#002356" }}>
      <div className="px-4 pt-4 pb-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">In-Store Price</span>
          <span className="font-bold text-white/50 line-through tabular-nums text-sm">
            {fmt(deal.originalPrice, deal.currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider">
            <span className="text-white">{isClosed ? "Final" : "Current"} Grou</span>
            <span style={{ color: "#eaad00" }}>pal</span>
            <span className="text-white"> Price</span>
          </span>
          <span className="font-extrabold text-white tabular-nums text-base">
            {fmt(computed.currentPrice, deal.currency)}
          </span>
        </div>
      </div>

      {/* Payments — inset lighter-navy card */}
      <div className="mx-4 rounded-xl p-3.5 space-y-3" style={{ backgroundColor: "#1b4487" }}>
        <p className="text-xs font-extrabold text-white uppercase tracking-wider">Payments</p>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white leading-snug">You payed upfront</p>
            <p className="text-[11px] text-white/60 mt-0.5">
              In-store price <span className="font-bold" style={{ color: "#eaad00" }}>{deal.reservationFeePercent}%</span>
            </p>
          </div>
          <span className="font-extrabold text-white tabular-nums text-sm flex-shrink-0">
            {fmt(reservationPaid, deal.currency)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white leading-snug">
              {isClosed ? "Your final payment is" : "Your estimated final payment is"}
            </p>
            <p className="text-[11px] text-white/60 mt-0.5">
              With <span className="font-bold" style={{ color: "#eaad00" }}>{computed.currentDiscountPercent.toFixed(1)}%</span> current discount
            </p>
          </div>
          <span className="font-extrabold text-white tabular-nums text-sm flex-shrink-0">
            {fmt(finalPayment, deal.currency)}
          </span>
        </div>
      </div>

      {/* Savings */}
      <div className="px-4 pt-3 pb-4 space-y-1.5">
        <p className="text-xs font-extrabold text-white uppercase tracking-wider">
          {isClosed ? "Final Savings" : "Current Savings"}
        </p>
        {isClosed ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white">
              Buying with{" "}
              <span className="font-heading font-extrabold">
                <span className="text-white">grou</span>
                <span style={{ color: "#eaad00" }}>pal</span>
              </span>{" "}
              saved you
            </span>
            <span className="font-extrabold tabular-nums text-sm flex-shrink-0" style={{ color: "#eaad00" }}>
              {fmt(savedAmount, deal.currency)}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">You are currently saving</span>
              <span className="font-extrabold tabular-nums text-sm flex-shrink-0 text-white">
                {fmt(computed.savingsAmount, deal.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">If this group fills up, every buyer saves</span>
              <span className="font-extrabold tabular-nums text-sm flex-shrink-0" style={{ color: "#eaad00" }}>
                {fmt(maxSavings, deal.currency)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Open deal — dashboard "My Group Buys" and purchases (active) ──────────────

export function OpenDealPaymentSummary({
  deal,
  reservationPaid,
  onShare,
}: {
  deal:            Deal
  reservationPaid: number
  onShare:         () => void
}) {
  return (
    <div>
      <PricingPanel deal={deal} reservationPaid={reservationPaid} isClosed={false} />
      <div className="px-4 pt-3 pb-4">
        <button onClick={onShare} className={CTA_BUTTON_CLASS} style={{ backgroundColor: "#eaad00" }}>
          <Share2 className="h-4 w-4" style={{ color: "#002356" }} />
          Share and drop the price for everyone!
        </button>
      </div>
    </div>
  )
}

// ── Closed deal — purchases (completed) ────────────────────────────────────────

export function ClosedDealPaymentSummary({
  deal,
  reservationPaid,
}: {
  deal:            Deal
  reservationPaid: number
}) {
  const { user } = useUser()

  const addOrUpdateReview = useReviewsStore((s) => s.addOrUpdateReview)
  const hasHydrated = useReviewsStore((s) => s.hasHydrated)
  const existingReview = useReviewsStore((s) =>
    user?.id ? s.reviews.find((r) => r.dealId === deal.id && r.buyerId === user.id) : undefined
  )
  const [reviewOpen, setReviewOpen] = useState(false)

  function handleSubmitReview(rating: number, comment: string) {
    if (!user?.id) return
    addOrUpdateReview({
      dealId:    deal.id,
      buyerId:   user.id,
      buyerName: user.fullName ?? user.firstName ?? "A Groupal buyer",
      rating,
      comment,
    })
  }

  return (
    <div>
      <PricingPanel deal={deal} reservationPaid={reservationPaid} isClosed />

      <div className="px-4 pt-3 pb-4">
        <button onClick={() => setReviewOpen(true)} className={CTA_BUTTON_CLASS} style={{ backgroundColor: "#eaad00" }}>
          <Star className="h-4 w-4" style={{ color: "#002356" }} fill="#002356" />
          {existingReview ? "Edit review" : "Review this product"}
        </button>
      </div>

      {hasHydrated && (
        <ReviewModal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          dealName={deal.productName}
          existingReview={existingReview}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  )
}
