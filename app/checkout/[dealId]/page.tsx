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
  Check, AlertTriangle, Lock, Users, Clock,
  TrendingDown, ShieldCheck, CreditCard, ArrowLeft,
  Info,
} from "lucide-react"
import { motion } from "framer-motion"
import { getMockDealById } from "@/lib/mock/deals"
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

function OrderSummary({
  deal,
  computed,
}: {
  deal:     ReturnType<typeof getMockDealById>
  computed: ReturnType<typeof computeDealValues>
}) {
  if (!deal) return null
  const platformFee   = computed.reservationAmount * 0.015
  const totalToday    = computed.reservationAmount + platformFee
  const totalClosing  = computed.remainingAmount + 25

  return (
    <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Deal image + name */}
      <div className="relative h-36 w-full">
        <Image src={deal.productImage} alt={deal.productName} fill className="object-cover" sizes="360px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <p className="absolute bottom-3 left-3 right-3 text-white font-bold text-sm leading-snug line-clamp-2">
          {deal.productName}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Prices */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 line-through tabular-nums">{fmt(deal.originalPrice, deal.currency)}</span>
          <span className="font-extrabold text-[#002356] tabular-nums text-lg">{fmt(computed.currentPrice, deal.currency)}</span>
        </div>

        {/* Today total */}
        <div className="rounded-xl p-3" style={{ backgroundColor: "#eaad00" }}>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#002356]/70 mb-1">Due Today</p>
          <p className="font-extrabold text-[#002356] tabular-nums text-xl">{fmt(totalToday, deal.currency)}</p>
          <p className="text-[10px] text-[#002356]/60 mt-0.5">10% reservation + 1.5% fee</p>
        </div>

        {/* Closing total */}
        <div className="rounded-xl border border-gray-100 p-3 space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">At Deal Close</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Remaining (90%)</span>
            <span className="font-semibold tabular-nums">{fmt(computed.remainingAmount, deal.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            <span className="font-semibold tabular-nums">$25.00</span>
          </div>
          <div className="border-t border-gray-100 pt-1.5 flex justify-between text-sm font-bold">
            <span className="text-gray-700">Total at closing</span>
            <span className="text-[#002356] tabular-nums">{fmt(totalClosing, deal.currency)}</span>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          Prices may change slightly as more buyers join before you complete checkout
        </p>
      </div>
    </div>
  )
}

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
  const platformFee  = computed.reservationAmount * 0.015
  const totalToday   = computed.reservationAmount + platformFee
  const totalClosing = computed.remainingAmount + 25

  return (
    <div className="space-y-5">
      {/* Deal summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex gap-4 p-5">
          <div className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden">
            <Image src={deal.productImage} alt={deal.productName} fill className="object-cover" sizes="96px" />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-400 truncate">{deal.sellerName}</span>
              {deal.sellerVerified && (
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-[#1b4487]" />
              )}
            </div>
            <h2 className="font-bold text-[#002356] text-sm leading-snug line-clamp-2">
              {deal.productName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 line-through tabular-nums">
                {fmt(deal.originalPrice, deal.currency)}
              </span>
              <span
                className="font-extrabold tabular-nums text-base"
                style={{ color: "#eaad00" }}
              >
                {fmt(computed.currentPrice, deal.currency)}
              </span>
            </div>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "#DA1200" }}
            >
              -{computed.currentDiscountPercent.toFixed(1)}% off now
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="px-5 pb-4 space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>
                <span className="font-bold text-gray-700">{deal.currentBuyerCount}</span>
                {" of "}
                <span className="font-bold text-gray-700">{deal.maxBuyersRequired}</span>
                {" buyers joined"}
              </span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#DA1200]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(computed.progressPercent, 100)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" style={{ color: "#e86300" }} />
            <span>Ends in</span>
            <CountdownTimer targetDate={deal.deadlineAt} compact className="text-xs" />
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5 text-[#eaad00]" />
            Every new buyer drops the price further!
          </p>

          {/* Milestones */}
          <div className="flex items-center gap-3 pt-1">
            {deal.milestones.map((m, i) => (
              <span key={i} className="text-[11px] text-gray-400">
                {m.buyerCount} buyers → <span className="font-semibold text-gray-600">{m.discountPercent}% off</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* What you pay today */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">
          What You Pay Today
        </p>
        <div className="space-y-2">
          {[
            { label: "Current group price",  value: fmt(computed.currentPrice, deal.currency) },
            { label: "Reservation (10%)",    value: fmt(computed.reservationAmount, deal.currency) },
            { label: "Groupal fee (1.5%)",   value: fmt(platformFee, deal.currency) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold tabular-nums text-gray-700">{value}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="font-bold text-gray-900">Total today</span>
            <span className="font-extrabold tabular-nums text-[#002356] text-base">{fmt(totalToday, deal.currency)}</span>
          </div>
        </div>
      </div>

      {/* What you pay at close */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">
          What You Pay When Deal Closes
        </p>
        <div className="space-y-2">
          {[
            { label: "Remaining balance (90%)", value: fmt(computed.remainingAmount, deal.currency) },
            { label: "Delivery",                value: "$25.00" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold tabular-nums text-gray-700">{value}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="font-bold text-gray-900">Total at closing</span>
            <span className="font-extrabold tabular-nums text-[#002356] text-base">{fmt(totalClosing, deal.currency)}</span>
          </div>
        </div>
      </div>

      {/* Warning box */}
      <div className="rounded-2xl border-2 border-[#e86300] bg-[#e86300]/5 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#e86300]" />
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-bold text-[#e86300]">Important:</span>{" "}
          If your final payment cannot be processed when the deal closes, you will have{" "}
          <span className="font-bold">3 days</span> to update your payment method. After this
          period, your reservation will be forfeited and your initial payment will not be refunded.
          Please ensure your payment method is valid.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl font-extrabold text-white text-base cursor-pointer transition-colors"
        style={{ backgroundColor: "#002356" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1b4487")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#002356")}
      >
        Continue to Delivery
      </button>
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
  const platformFee = computed.reservationAmount * 0.015
  const totalToday  = computed.reservationAmount + platformFee

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
          {[
            { label: "Reservation (10%)",    value: fmt(computed.reservationAmount, deal.currency) },
            { label: "Groupal fee (1.5%)",   value: fmt(platformFee, deal.currency) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="tabular-nums text-gray-700">{value}</span>
            </div>
          ))}
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

  const [step,         setStep]         = useState(0)
  const [deliveryData, setDeliveryData] = useState<DeliveryForm | null>(null)
  const [loading,      setLoading]      = useState(false)

  const deal     = getMockDealById(dealId)
  const computed = deal ? computeDealValues(deal) : null

  if (!deal || !computed) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
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

  const platformFee = computed.reservationAmount * 0.015

  async function handleComplete() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 2000))
    addParticipation({
      id:              nanoid(),
      dealId:          deal!.id,
      joinedAt:        new Date().toISOString(),
      reservationPaid: computed!.reservationAmount,
      platformFee:     platformFee,
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

  return (
    <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="max-w-[1100px] mx-auto px-4">

        {/* Back link */}
        <Link
          href={`/deals/${deal.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#002356] transition-colors font-medium mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to deal
        </Link>

        {/* Progress indicator */}
        <StepIndicator current={step} />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* Main content */}
          <div>
            {step === 0 && (
              <StepReview
                deal={deal}
                computed={computed}
                onContinue={() => setStep(1)}
              />
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
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <OrderSummary deal={deal} computed={computed} />
          </div>
        </div>
      </div>
    </main>
  )
}
