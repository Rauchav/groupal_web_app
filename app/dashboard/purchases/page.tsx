"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ShoppingBag, Heart, Settings, LayoutList,
  ShoppingCart, Clock, Users,
} from "lucide-react"
import { useParticipationStore, MockParticipation } from "@/lib/stores/participation-store"
import { MOCK_DEALS } from "@/lib/mock/deals"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import { CountdownTimer } from "@/components/marketplace/CountdownTimer"
import { format } from "date-fns"

// ── Sidebar ───────────────────────────────────────────────────────────────────

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

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "active" | "completed" | "forfeited" }) {
  if (status === "active") return (
    <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
      In Progress
    </span>
  )
  if (status === "completed") return (
    <span className="inline-block px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
      Completed ✓
    </span>
  )
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
      Reservation Forfeited
    </span>
  )
}

// ── Participation card ────────────────────────────────────────────────────────

function ParticipationCard({ p }: { p: MockParticipation }) {
  const deal = MOCK_DEALS.find((d) => d.id === p.dealId)
  if (!deal) return null
  const computed = computeDealValues(deal)
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: deal.currency ?? "USD", minimumFractionDigits: 2 }).format(n)
  const joinedDate = format(new Date(p.joinedAt), "MMM d, yyyy")

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden">
          <Image src={deal.productImage} alt={deal.productName} fill className="object-cover" sizes="80px" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="font-bold text-[#002356] text-sm leading-snug line-clamp-2">
            {deal.productName}
          </h3>
          <StatusBadge status={p.status} />
          <p className="text-xs text-gray-400">Joined {joinedDate}</p>
          <p className="text-xs text-gray-500">
            Paid: <span className="font-semibold text-gray-700">{fmt(p.reservationPaid + p.platformFee)}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        {p.status === "active" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="h-3.5 w-3.5" />
              <span>
                <span className="font-bold text-gray-700">{deal.currentBuyerCount}</span>
                {" / "}
                <span className="font-bold text-gray-700">{deal.maxBuyersRequired}</span>
                {" buyers"}
              </span>
              <span className="font-bold text-[#DA1200] ml-auto">{computed.currentDiscountPercent.toFixed(1)}% off</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#DA1200]"
                style={{ width: `${Math.min(computed.progressPercent, 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5 text-[#e86300]" />
              <span>Ends in:</span>
              <CountdownTimer targetDate={deal.deadlineAt} compact className="text-xs" />
            </div>
          </div>
        )}

        {p.status === "completed" && (
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Final price paid</p>
              <p className="font-bold text-[#002356]">{fmt(computed.currentPrice + 25)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Discount achieved</p>
              <p className="font-bold text-[#048943]">{computed.currentDiscountPercent.toFixed(1)}% off</p>
            </div>
          </div>
        )}

        {p.status === "forfeited" && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Your reservation was forfeited. We&apos;re sorry it didn&apos;t work out this time.
            </p>
            <Link
              href="/deals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#002356] hover:underline"
            >
              Browse new deals →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const participations = useParticipationStore((s) => s.participations)

  return (
    <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="max-w-[1100px] mx-auto px-4">
        <MobileTabs active="/dashboard/purchases" />

        <div className="flex gap-6">
          <Sidebar active="/dashboard/purchases" />

          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-[#002356] text-2xl">
                All Purchases
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Every group buy you&apos;ve joined — past and present.
              </p>
            </div>

            {participations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="flex justify-center mb-4">
                  <LayoutList className="h-14 w-14 text-gray-200" />
                </div>
                <h3 className="font-bold text-gray-700 text-lg mb-1">No purchases yet</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Join a group buy to see your purchase history here.
                </p>
                <Link
                  href="/deals"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ backgroundColor: "#002356" }}
                >
                  Browse Deals
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {participations.map((p) => (
                  <ParticipationCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
