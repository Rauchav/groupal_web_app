"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useParticipationStore, MockParticipation } from "@/lib/stores/participation-store"
import { syncDealClosures } from "@/lib/payments/sync-deal-closures"
import { MOCK_DEALS } from "@/lib/mock/deals"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import { OpenDealPaymentSummary, MilestoneScale } from "@/components/dashboard/DealPaymentSummary"
import { DashboardSidebar, DashboardMobileTabs } from "@/components/dashboard/DashboardNav"
import { CountdownTimer } from "@/components/marketplace/CountdownTimer"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  ShoppingBag, Users, TrendingDown, Clock,
} from "lucide-react"

// ── Dashboard deal card ───────────────────────────────────────────────────────

function ActiveDealCard({ participation }: { participation: MockParticipation }) {
  const deal = MOCK_DEALS.find((d) => d.id === participation.dealId)
  if (!deal) return null
  const computed = computeDealValues(deal)
  const isDealOpen = deal.currentBuyerCount < deal.maxBuyersRequired && new Date() < deal.deadlineAt

  function shareLink() {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/checkout/${deal!.id}`
      : `/checkout/${deal!.id}`
    navigator.clipboard.writeText(url).then(() => toast.success("Share link copied!"))
  }

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-4 p-4">
        <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden">
          <Image src={deal.productImage} alt={deal.productName} fill className="object-cover" sizes="80px" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-bold text-[#002356] text-sm leading-snug line-clamp-2">{deal.productName}</h3>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isDealOpen ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {isDealOpen ? "Open Deal" : "Deal Closed"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 space-y-3">
        <MilestoneScale deal={deal} />

        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users className="h-3.5 w-3.5" />
          <span>
            <span className="font-bold text-gray-700">{deal.currentBuyerCount}</span>
            {" of "}
            <span className="font-bold text-gray-700">{deal.maxBuyersRequired}</span>
            {" buyers participated"}
          </span>
          <span className="font-bold ml-auto" style={{ color: "#DA1200" }}>
            {computed.currentDiscountPercent.toFixed(1)}% off
          </span>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="h-3.5 w-3.5" style={{ color: "#e86300" }} />
          <span>Ends in:</span>
          <CountdownTimer targetDate={deal.deadlineAt} compact className="text-xs" />
        </div>
      </div>

      {/* Payments */}
      <OpenDealPaymentSummary deal={deal} reservationPaid={participation.reservationPaid} onShare={shareLink} />
    </motion.div>
  )
}

// ── Stats card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-extrabold text-[#002356] text-2xl tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser()
  // Gate on hasHydrated so the first client render matches the server's
  // always-empty SSR state — otherwise the real (persisted) list vs. the
  // empty state below diverge and React throws a hydration mismatch.
  const hasHydrated = useParticipationStore((s) => s.hasHydrated)
  const participations = useParticipationStore((s) => s.participations)
  const effectiveParticipations = hasHydrated ? participations : []
  const active    = effectiveParticipations.filter((p) => p.status === "active")

  // No real job scheduler yet (see lib/jobs/scheduler.ts) — check on every
  // load whether any of this buyer's active deals are ready to close, and
  // if so run the close job and reflect the outcome here.
  useEffect(() => {
    if (hasHydrated && user?.id) void syncDealClosures(user.id)
  }, [hasHydrated, user?.id])
  const completed = effectiveParticipations.filter((p) => p.status === "completed")

  const totalSaved = completed.reduce((sum, p) => {
    const deal = MOCK_DEALS.find((d) => d.id === p.dealId)
    if (!deal) return sum
    const computed = computeDealValues(deal)
    return sum + computed.savingsAmount
  }, 0)

  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(user.createdAt))
    : "—"

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f8f9fa", paddingTop: "7.5rem", paddingBottom: "4rem" }}>
      <div className="max-w-[1100px] mx-auto px-4">

        <DashboardMobileTabs active="/dashboard" />

        <div className="flex gap-6">
          <DashboardSidebar active="/dashboard" />

          <div className="flex-1 min-w-0 space-y-6">

            {/* Welcome header */}
            <div>
              <h1 className="font-heading font-extrabold text-[#002356] text-2xl">
                Welcome back, {user?.firstName ?? "there"}! 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Here&apos;s what&apos;s happening with your group buys.
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Total saved"
                value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalSaved)}
                sub="across completed deals"
              />
              <StatCard
                label="Active deals"
                value={active.length}
                sub="currently joined"
              />
              <StatCard
                label="Deals completed"
                value={completed.length}
                sub="all time"
              />
              <StatCard
                label="Member since"
                value={memberSince}
              />
            </div>

            {/* Active group buys */}
            <section>
              <h2 className="font-heading font-bold text-[#002356] text-lg mb-4">
                Your Active Group Buys
              </h2>

              {active.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="flex justify-center mb-4">
                    <ShoppingBag className="h-14 w-14 text-gray-200" />
                  </div>
                  <h3 className="font-bold text-gray-700 text-lg mb-1">No active group buys yet</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Browse deals and join your first group buy to start saving!
                  </p>
                  <Link
                    href="/deals"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-colors"
                    style={{ backgroundColor: "#002356" }}
                  >
                    <TrendingDown className="h-4 w-4" />
                    Browse Deals
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {active.map((p) => (
                    <ActiveDealCard key={p.id} participation={p} />
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}
