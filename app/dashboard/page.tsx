"use client"

import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useParticipationStore, MockParticipation } from "@/lib/stores/participation-store"
import { MOCK_DEALS } from "@/lib/mock/deals"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import { CountdownTimer } from "@/components/marketplace/CountdownTimer"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  ShoppingBag, Heart, Settings, LayoutList,
  Share2, Users, TrendingDown, ShoppingCart,
} from "lucide-react"

// ── Sidebar nav ───────────────────────────────────────────────────────────────

function Sidebar({ active }: { active: string }) {
  const items = [
    { href: "/dashboard",            icon: ShoppingBag, label: "My Group Buys" },
    { href: "/dashboard/liked",      icon: Heart,       label: "Liked Deals" },
    { href: "/dashboard/purchases",  icon: LayoutList,  label: "Purchases" },
    { href: "/dashboard/settings",   icon: Settings,    label: "Settings" },
  ]

  return (
    <aside className="hidden lg:flex flex-col w-60 flex-shrink-0">
      <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {items.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors ${
              active === href
                ? "bg-[#002356] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
        <div className="border-t border-gray-100">
          <Link
            href="/deals"
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
            Back to Marketplace
          </Link>
        </div>
      </nav>
    </aside>
  )
}

// ── Mobile tabs ───────────────────────────────────────────────────────────────

function MobileTabs({ active }: { active: string }) {
  const tabs = [
    { href: "/dashboard",           label: "Buys" },
    { href: "/dashboard/liked",     label: "Liked" },
    { href: "/dashboard/purchases", label: "Purchases" },
    { href: "/dashboard/settings",  label: "Settings" },
  ]
  return (
    <div className="flex lg:hidden gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 mb-4 overflow-x-auto">
      {tabs.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`flex-1 text-center py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap px-3 ${
            active === href
              ? "bg-[#002356] text-white"
              : "text-gray-500 hover:text-[#002356]"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

// ── Dashboard deal card ───────────────────────────────────────────────────────

function ActiveDealCard({ participation }: { participation: MockParticipation }) {
  const deal = MOCK_DEALS.find((d) => d.id === participation.dealId)
  if (!deal) return null
  const computed = computeDealValues(deal)

  function shareLink() {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/deals/${deal!.id}`
      : `/deals/${deal!.id}`
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
            <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
              Active — Awaiting deal close
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                <span className="font-bold text-gray-700">{deal.currentBuyerCount}</span>
                {" / "}
                <span className="font-bold text-gray-700">{deal.maxBuyersRequired}</span>
                {" buyers"}
              </span>
            </span>
            <span className="font-bold" style={{ color: "#DA1200" }}>
              {computed.currentDiscountPercent.toFixed(1)}% off
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#DA1200] transition-all"
              style={{ width: `${Math.min(computed.progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>Ends in:</span>
          <CountdownTimer targetDate={deal.deadlineAt} compact className="text-xs" />
        </div>

        {/* Payments */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Paid today</p>
            <p className="font-bold text-[#002356] tabular-nums text-sm">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: deal.currency ?? "USD", minimumFractionDigits: 2 }).format(participation.reservationPaid + participation.platformFee)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Est. final</p>
            <p className="font-bold text-[#002356] tabular-nums text-sm">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: deal.currency ?? "USD", minimumFractionDigits: 2 }).format(computed.remainingAmount + 25)}
            </p>
          </div>
        </div>

        <button
          onClick={shareLink}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#eaad00] hover:text-[#002356] hover:bg-[#eaad00]/5 transition-colors cursor-pointer"
        >
          <Share2 className="h-4 w-4" />
          Share Deal — drop the price for everyone!
        </button>
      </div>
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
  const participations = useParticipationStore((s) => s.participations)
  const active    = participations.filter((p) => p.status === "active")
  const completed = participations.filter((p) => p.status === "completed")

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
    <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="max-w-[1100px] mx-auto px-4">

        <MobileTabs active="/dashboard" />

        <div className="flex gap-6">
          <Sidebar active="/dashboard" />

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
