"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import {
  Check, AlertTriangle, Lock, Clock, MapPin, Truck, Store,
  ShieldCheck, CreditCard, ArrowLeft, Share2, Copy,
  Info, ExternalLink,
} from "lucide-react"
import { motion } from "framer-motion"
import { getMockDealById, MOCK_DEALS } from "@/lib/mock/deals"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import { useParticipationStore } from "@/lib/stores/participation-store"
import { CountdownTimer } from "@/components/marketplace/CountdownTimer"
import { cn } from "@/lib/utils"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function fmtShort(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Delivery form schema ──────────────────────────────────────────────────────

const deliverySchema = z.object({
  fullName:    z.string().min(2, "Full name is required"),
  phone:       z.string().min(6, "Phone number is required"),
  street:      z.string().min(3, "Street address is required"),
  city:        z.string().min(2, "City is required"),
  state:       z.string().min(2, "State / Department is required"),
  country:     z.string().min(2, "Country is required"),
  zipCode:     z.string().optional(),
})
type DeliveryForm = z.infer<typeof deliverySchema>

// ── Progress indicator ────────────────────────────────────────────────────────

const STEPS = ["Review Deal", "Delivery Details", "Confirm & Pay"] as const

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto mb-8">
      {STEPS.map((label, i) => {
        const done    = i < current
        const active  = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  done   && "bg-[#048943] text-white",
                  active && "bg-[#002356] text-white ring-4 ring-[#002356]/20",
                  !done && !active && "bg-gray-200 text-gray-400",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold whitespace-nowrap",
                  active && "text-[#002356]",
                  done   && "text-[#048943]",
                  !done && !active && "text-gray-400",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mb-5",
                  i < current ? "bg-[#048943]" : "bg-gray-200",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Order summary sidebar ─────────────────────────────────────────────────────

// ── Step 1 — Review ───────────────────────────────────────────────────────────

function StepReview({
  deal,
  computed,
  onContinue,
}: {
  deal:       ReturnType<typeof getMockDealById>
  computed:   ReturnType<typeof computeDealValues>
  onContinue: () => void
}) {
  if (!deal) return null

  const totalToday = computed.reservationAmount
  const remaining90 = deal.originalPrice * 0.9
  const maxSavings = deal.originalPrice * (deal.maxDiscountPercent / 100)
  const zoneColor =
    computed.progressPercent < 33.34
      ? { bar: "bg-[#EAAD00]", bg: "#EAAD00", pillText: "#002356" }
      : computed.progressPercent < 66.67
      ? { bar: "bg-[#E86300]", bg: "#E86300", pillText: "#ffffff" }
      : { bar: "bg-[#DA1200]", bg: "#DA1200", pillText: "#ffffff" }

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
  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied!")
  }

  return (
    <div className="space-y-4">

      {/* ── White product info card ─────────────────────── */}
      <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm border border-gray-100">

        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#002356]/10 text-[#002356]">
          {deal.category}
        </span>

        <h2 className="font-bold text-[#002356] text-xl leading-snug">
          {deal.productName}
        </h2>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-500">by {deal.sellerName}</span>
          {deal.sellerVerified && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1b4487]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Seller
            </span>
          )}
        </div>

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

      {/* ── Navy CTA card ───────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: "#002356" }}>

        <div className="px-6 py-5 space-y-5">

          {/* Store price vs Groupal price */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-white/50 text-xs font-extrabold uppercase tracking-widest mb-1">
                Regular Store Price
              </p>
              <a
                href={deal.sellerUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span
                  className="font-bold text-white/60 tabular-nums line-through leading-none"
                  style={{ fontSize: "1.5rem" }}
                >
                  {fmtShort(deal.originalPrice, deal.currency)}
                </span>
                <ExternalLink className="h-4 w-4 text-white/40 transition-colors group-hover:text-groupal-gold flex-shrink-0" />
              </a>
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

          <p className="text-sm text-white">
            Join now and save from{" "}
            <span className="font-bold" style={{ color: "#eaad00" }}>{fmtShort(computed.savingsAmount, deal.currency)}</span>
            {" "}up to{" "}
            <span className="font-bold" style={{ color: "#eaad00" }}>{fmtShort(maxSavings, deal.currency)}</span>
          </p>

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
                className={cn("h-full rounded-full", zoneColor.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(computed.progressPercent, 100)}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            <p className="text-white/60 text-xs">
              Every new buyer adds <span className="font-extrabold text-white">{computed.discountPerBuyer.toFixed(2)}%</span> more discount for everyone in the group
            </p>
          </div>

          {/* Now vs. max scenario comparison */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white">
                Right now, <span className="font-bold" style={{ color: "#eaad00" }}>{deal.currentBuyerCount}</span> of <span className="font-bold" style={{ color: "#eaad00" }}>{deal.maxBuyersRequired}</span> buyers joined
              </span>
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums flex-shrink-0"
                style={{ backgroundColor: zoneColor.bg, color: zoneColor.pillText }}
              >
                {computed.currentDiscountPercent.toFixed(1)}% off
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
              <span className="font-semibold text-sm" style={{ color: "white" }}><span style={{ color: "#eaad00" }}>Current savings</span> for each buyer participating</span>
              <span className="font-extrabold tabular-nums flex-shrink-0" style={{ color: "#eaad00" }}>
                {fmtShort(computed.savingsAmount, deal.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm pt-1">
              <span className="text-white">
                If <span className="font-bold" style={{ color: "#eaad00" }}>{deal.maxBuyersRequired}</span> of <span className="font-bold" style={{ color: "#eaad00" }}>{deal.maxBuyersRequired}</span> buyers join
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums flex-shrink-0 bg-groupal-red text-white">
                {deal.maxDiscountPercent}% off
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
              <span className="font-semibold text-sm" style={{ color: "white" }}>Each buyer participating <span style={{ color: "#eaad00" }}>can save up to</span></span>
              <span className="font-extrabold tabular-nums flex-shrink-0" style={{ color: "#eaad00" }}>
                {fmtShort(maxSavings, deal.currency)}
              </span>
            </div>
          </div>

          {/* ── Ready to join in? ──────────────────────── */}
          <div className="pt-2 border-t border-white/10 space-y-4">
            <p className="text-center font-extrabold text-white tracking-wide" style={{ fontSize: "1.1rem" }}>
              Ready to join in?
            </p>

            <div className="rounded-xl p-4 space-y-4" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest mb-2.5" style={{ color: "#eaad00" }}>
                  Secure your spot in the group buy
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white">Join in by paying in advance 10% of the store price</span>
                    <span className="text-white font-semibold tabular-nums flex-shrink-0">{fmt(totalToday, deal.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white">And wait to see how much discount this group accumulates</span>
                    <span className="font-extrabold flex-shrink-0" style={{ color: "#eaad00" }}>?%</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <p className="font-heading text-xs font-extrabold uppercase tracking-widest mb-2.5" style={{ color: "#eaad00" }}>
                  When the deal closes
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white">You pay the remaining 90%</span>
                    <span className="text-white font-semibold tabular-nums flex-shrink-0">{fmt(remaining90, deal.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white">Minus (-) <span style={{ color: "#eaad00", fontWeight: "Bold"}}>the accumulated groupal discount</span></span>
                    <span className="text-white font-semibold tabular-nums flex-shrink-0">Now at <span className="font-bold" style={{ color: "#eaad00" }}>{fmtShort(computed.savingsAmount, deal.currency)}</span> up to <span className="font-bold" style={{ color: "#eaad00" }}>{fmtShort(maxSavings, deal.currency)}</span></span>
                  </div>
                </div>
              </div>
            </div>

          {/* Social share */}
          <div className="space-y-2">
            <p className="text-white/80 text-xs pb-2 text-center font-medium">
              <span style={{ color: "#eaad00", fontWeight: "Bold" }}>Every new buyer </span>who joins<span style={{ color: "#eaad00", fontWeight: "Bold"}}> increases the group discount</span>, lowering this item final price,<br/>
               so <span style={{ color: "#eaad00", fontWeight: "Bold"}}>join now</span> and start <span style={{ color: "#eaad00", fontWeight: "Bold"}}>sharing this deal</span> with all your contacts 👥
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

           {/* Countdown */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-white/60 text-sm" style={{marginBottom: "10px"}}>
              <Clock className="h-4 w-4" />
              <span style={{color: "white",fontWeight: "Bold"}}>Deal ends in:</span>
            </div>
            <CountdownTimer targetDate={deal.deadlineAt} />
          </div>

          {/* Warning box */}
          <div className="rounded-2xl border-2 border-[#e86300] bg-white p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#e86300]" />
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>
                <span className="font-bold text-[#e86300]">Important:</span>{" "}
                You pay only 10% of the store price today, and when the deal closes we'll automatically charge the rest (remmaining 90% minus your the accumulated group discount) to the same payment method. Please make sure to have the sufficient funds to fulfill the second payment. If you don't have enough funds in your initial payment method, don't worry, you will have enough time to update it until the final payment go trough. Please be aware that avoiding to fulfill the final payment could compromise your 10% upfront payment.
              </p>
              <p>
                <span className="font-bold text-[#e86300]">Every deal will make you save money:</span>{" "}
                Even if you are the only buyer, you will save at least{" "}
                <span className="font-bold">{computed.discountPerBuyer.toFixed(2)}%</span> off the store price. The more buyers join, the bigger discount the group enjoys.
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-xl font-extrabold text-white text-base cursor-pointer transition-colors"
            style={{ backgroundColor: "#048943" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#059c4f")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#048943")}
          >
            Secure your spot with just {fmt(totalToday, deal.currency)}
          </button>

        </div>
      </div>
    </div>
  )
}

// ── Step 2 — Delivery ─────────────────────────────────────────────────────────

function StepDelivery({
  deal,
  onContinue,
  onBack,
}: {
  deal:       ReturnType<typeof getMockDealById>
  onContinue: (data: DeliveryForm) => void
  onBack:     () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryForm>({
    resolver: zodResolver(deliverySchema),
    defaultValues: { country: "Bolivia" },
  })

  const isPickup = deal?.category === "Travel"

  if (isPickup) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-3xl mb-3">🏪</p>
          <h3 className="font-bold text-[#002356] text-lg mb-2">
            This item requires pickup at the seller&apos;s location.
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            No delivery address needed. The seller will contact you with pickup details after the deal closes.
          </p>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Seller Contact</p>
            <p className="text-sm text-gray-600 font-medium">{deal?.sellerName}</p>
            <p className="text-xs text-gray-400 mt-0.5">Contact info will be shared after deal closes</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={() => onContinue({ fullName: "", phone: "", street: "N/A (Pickup)", city: "", state: "", country: "N/A", zipCode: "" })}
            className="flex-1 py-3.5 rounded-2xl font-extrabold text-white text-sm cursor-pointer transition-colors"
            style={{ backgroundColor: "#002356" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1b4487")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#002356")}
          >
            Continue to Payment
          </button>
        </div>
      </div>
    )
  }

  const fields: { id: keyof DeliveryForm; label: string; placeholder: string; required?: boolean }[] = [
    { id: "fullName",  label: "Full Name",              placeholder: "Maria García",        required: true },
    { id: "phone",     label: "Phone Number",           placeholder: "+591 70000000",       required: true },
    { id: "street",    label: "Street Address",         placeholder: "Av. 6 de Agosto 123", required: true },
    { id: "city",      label: "City",                   placeholder: "La Paz",              required: true },
    { id: "state",     label: "State / Department",     placeholder: "La Paz",              required: true },
    { id: "country",   label: "Country",                placeholder: "Bolivia",             required: true },
    { id: "zipCode",   label: "ZIP Code",               placeholder: "Optional",            required: false },
  ]

  return (
    <form onSubmit={handleSubmit(onContinue)} className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#002356] text-base mb-4">Delivery Address</h3>
        <div className="space-y-4">
          {fields.map(({ id, label, placeholder, required }) => (
            <div key={id}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                {...register(id)}
                placeholder={placeholder}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all",
                  "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
                  errors[id]
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                )}
              />
              {errors[id] && (
                <p className="text-xs text-red-500 mt-1">{errors[id]?.message as string}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 py-3.5 rounded-2xl font-extrabold text-white text-sm cursor-pointer transition-colors"
          style={{ backgroundColor: "#002356" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1b4487")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#002356")}
        >
          Continue to Payment
        </button>
      </div>
    </form>
  )
}

// ── Step 3 — Confirm & Pay ────────────────────────────────────────────────────

function StepConfirm({
  deal,
  computed,
  deliveryData,
  onBack,
  onComplete,
  loading,
}: {
  deal:         ReturnType<typeof getMockDealById>
  computed:     ReturnType<typeof computeDealValues>
  deliveryData: DeliveryForm | null
  onBack:       () => void
  onComplete:   () => void
  loading:      boolean
}) {
  if (!deal) return null
  const totalToday = computed.reservationAmount

  return (
    <div className="space-y-5">
      {/* Dev mode banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          <span className="font-bold">Development Mode:</span> Payment is simulated. No real charges will be made.
        </p>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-[#002356] text-base">Order Summary</h3>
        <div className="flex gap-3">
          <div className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden">
            <Image src={deal.productImage} alt={deal.productName} fill className="object-cover" sizes="64px" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm line-clamp-2">{deal.productName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{deal.sellerName}</p>
          </div>
        </div>
        <div className="space-y-1.5 border-t border-gray-100 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reservation (10%)</span>
            <span className="tabular-nums text-gray-700">{fmt(computed.reservationAmount, deal.currency)}</span>
          </div>
          <div className="border-t border-gray-100 pt-1.5 flex justify-between font-bold">
            <span className="text-gray-900">Total due today</span>
            <span className="text-[#002356] tabular-nums text-base">{fmt(totalToday, deal.currency)}</span>
          </div>
        </div>

        {/* Delivery address */}
        {deliveryData && deliveryData.street !== "N/A (Pickup)" && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Delivering to</p>
            <p className="text-sm text-gray-600">
              {deliveryData.fullName} · {deliveryData.phone}
            </p>
            <p className="text-sm text-gray-600">
              {deliveryData.street}, {deliveryData.city}
            </p>
            <p className="text-sm text-gray-600">
              {deliveryData.state}, {deliveryData.country}
            </p>
          </div>
        )}
      </div>

      {/* Mock payment UI */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#002356] text-base">Payment Method</h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="h-3.5 w-3.5" />
            <span>Secured by Stripe</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">Card Number</span>
          </div>
          <input
            readOnly
            placeholder="4242 4242 4242 4242"
            className="w-full bg-transparent text-sm text-gray-400 outline-none placeholder-gray-300 tabular-nums"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Expiry</p>
            <input
              readOnly
              placeholder="MM / YY"
              className="w-full bg-transparent text-sm text-gray-400 outline-none placeholder-gray-300"
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">CVV</p>
            <input
              readOnly
              placeholder="•••"
              className="w-full bg-transparent text-sm text-gray-400 outline-none placeholder-gray-300"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">Cardholder Name</p>
          <input
            readOnly
            placeholder="Name on card"
            className="w-full bg-transparent text-sm text-gray-400 outline-none placeholder-gray-300"
          />
        </div>

        <p className="text-center text-xs text-gray-400">
          Stripe integration coming soon — this is a simulated checkout
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={loading}
          className="flex-[2] py-4 rounded-2xl font-extrabold text-white text-base cursor-pointer transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#048943" }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#059c4f")}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#048943")}
        >
          {loading ? (
            <>
              <motion.div
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Processing...
            </>
          ) : (
            `Complete Reservation — ${fmt(totalToday, deal.currency)}`
          )}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        🔒 Secure checkout · SSL encrypted · Cancel anytime
      </p>
    </div>
  )
}

// ── Main checkout page ────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { dealId } = useParams<{ dealId: string }>()
  const router     = useRouter()
  const { addParticipation } = useParticipationStore()

  const [step,            setStep]            = useState(0)
  const [deliveryData,    setDeliveryData]    = useState<DeliveryForm | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [selectedImgIdx,  setSelectedImgIdx]  = useState(0)

  const deal     = getMockDealById(dealId)
  const computed = deal ? computeDealValues(deal) : null

  const mockImages    = deal ? [deal.productImage, deal.productImage, deal.productImage] : []
  const relatedDeals  = MOCK_DEALS.filter(d => d.id !== dealId).slice(0, 3)

  if (!deal || !computed) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ paddingTop: "6.5rem" }}>
        <div className="text-center space-y-4">
          <p className="text-5xl">😕</p>
          <h1 className="text-xl font-bold text-gray-700">Deal not found</h1>
          <Link href="/deals" className="inline-block mt-2 text-sm text-[#002356] font-semibold underline">
            Back to deals
          </Link>
        </div>
      </main>
    )
  }

  async function handleComplete() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 2000))
    addParticipation({
      id:              nanoid(),
      dealId:          deal!.id,
      joinedAt:        new Date().toISOString(),
      reservationPaid: computed!.reservationAmount,
      status:          "active",
      deliveryAddress: {
        street:  deliveryData?.street  ?? "",
        city:    deliveryData?.city    ?? "",
        state:   deliveryData?.state   ?? "",
        country: deliveryData?.country ?? "",
        zipCode: deliveryData?.zipCode ?? "",
      },
    })
    toast.success("You're in! Welcome to the group!")
    router.push(`/checkout/success?dealId=${deal!.id}`)
  }

  const stickyTotal = computed.reservationAmount

  return (
    <>
    <main
      className={cn("min-h-screen", step === 0 ? "pb-28 lg:pb-16" : "pb-16")}
      style={{ backgroundColor: "#f8f9fa", paddingTop: "7.5rem" }}
    >
      <div className="max-w-[1100px] mx-auto px-4">

        {/* Back link */}
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#002356] transition-colors font-medium mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to deals
        </Link>

        {/* Progress indicator */}
        <StepIndicator current={step} />

        {/* Mobile/tablet: horizontal image slider */}
        <div className="lg:hidden -mx-4 mb-5">
          <div className="flex gap-3 overflow-x-auto px-4 pb-3 snap-x snap-mandatory">
            {mockImages.map((img, i) => (
              <div key={i} className="relative h-64 w-[85vw] flex-shrink-0 rounded-2xl overflow-hidden snap-start">
                <Image src={img} alt={`${deal.productName} view ${i + 1}`} fill className="object-cover" sizes="85vw" />
              </div>
            ))}
          </div>
        </div>

        {/* Two-column on desktop */}
        <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-8 lg:items-start">

          {/* LEFT — Gallery + Related (desktop only) */}
          <div className="hidden lg:flex lg:flex-col lg:sticky lg:top-24 gap-3">
            {/* Main image */}
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden">
              <Image
                src={mockImages[selectedImgIdx]}
                alt={deal.productName}
                fill
                className="object-cover transition-all duration-300"
                sizes="420px"
              />
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2">
              {mockImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImgIdx(i)}
                  className={cn(
                    "relative h-20 w-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-150",
                    selectedImgIdx === i
                      ? "border-[#002356] scale-95"
                      : "border-gray-200 hover:border-gray-400"
                  )}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>

            {/* Related products — desktop */}
            {relatedDeals.length > 0 && (
              <div className="pt-2 space-y-3">
                <h3 className="font-bold text-[#002356] text-sm">You might also like</h3>
                <div className="space-y-2">
                  {relatedDeals.map((rd) => {
                    const rc = computeDealValues(rd)
                    const tagBg = rc.progressPercent < 33.34 ? "bg-groupal-gold" : rc.progressPercent < 66.67 ? "bg-groupal-orange" : "bg-groupal-red"
                    const tagText = rc.progressPercent < 33.34 ? "text-groupal-navy" : "text-white"
                    return (
                      <Link
                        key={rd.id}
                        href={`/checkout/${rd.id}`}
                        className="flex gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image src={rd.productImage} alt={rd.productName} fill className="object-cover" sizes="56px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#002356] line-clamp-2 leading-snug">{rd.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 line-through tabular-nums">{fmt(rd.originalPrice, rd.currency)}</span>
                            <span className="text-xs font-bold text-[#002356] tabular-nums">{fmt(rc.currentPrice, rd.currency)}</span>
                          </div>
                        </div>
                        <span className={cn("self-start inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0", tagBg, tagText)}>
                          -{rc.currentDiscountPercent.toFixed(0)}%
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Checkout steps */}
          <div>
            {step === 0 && (
              <StepReview deal={deal} computed={computed} onContinue={() => setStep(1)} />
            )}
            {step === 1 && (
              <StepDelivery
                deal={deal}
                onContinue={(data) => { setDeliveryData(data); setStep(2) }}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <StepConfirm
                deal={deal}
                computed={computed}
                deliveryData={deliveryData}
                onBack={() => setStep(1)}
                onComplete={handleComplete}
                loading={loading}
              />
            )}

            {/* Related products — mobile/tablet */}
            {relatedDeals.length > 0 && (
              <div className="lg:hidden mt-8 space-y-3">
                <h3 className="font-bold text-[#002356] text-sm">You might also like</h3>
                <div className="grid grid-cols-2 gap-3">
                  {relatedDeals.map((rd) => {
                    const rc = computeDealValues(rd)
                    const tagBg = rc.progressPercent < 33.34 ? "bg-groupal-gold" : rc.progressPercent < 66.67 ? "bg-groupal-orange" : "bg-groupal-red"
                    const tagText = rc.progressPercent < 33.34 ? "text-groupal-navy" : "text-white"
                    return (
                      <Link
                        key={rd.id}
                        href={`/checkout/${rd.id}`}
                        className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="relative h-28 w-full">
                          <Image src={rd.productImage} alt={rd.productName} fill className="object-cover" sizes="200px" />
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-semibold text-[#002356] line-clamp-2 leading-snug">{rd.productName}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs font-bold text-[#002356] tabular-nums">{fmt(rc.currentPrice, rd.currency)}</span>
                            <span className={cn("inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold", tagBg, tagText)}>
                              -{rc.currentDiscountPercent.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>

    {/* ── Sticky mobile CTA — step 0 only ─────────────── */}
    {step === 0 && (
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-500 leading-none mb-0.5">Join today for just</p>
            <p className="font-extrabold tabular-nums text-lg leading-tight" style={{ color: "#002356" }}>
              {fmt(stickyTotal, deal.currency)}
            </p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">10% reservation · pay rest at closing</p>
          </div>
          <button
            onClick={() => setStep(1)}
            className="flex-1 py-3.5 rounded-xl font-extrabold text-white text-sm cursor-pointer transition-colors"
            style={{ backgroundColor: "#048943" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#059c4f")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#048943")}
          >
            Join Now
          </button>
        </div>
      </div>
    )}
    </>
  )
}
