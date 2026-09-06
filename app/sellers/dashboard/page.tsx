"use client"

import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { PlusCircle, PackageCheck, Users, DollarSign, TrendingUp } from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <Icon className="h-3.5 w-3.5 text-gray-300" />
      </div>
      <p className="font-extrabold text-[#002356] text-2xl tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function SellerDashboardPage() {
  const { user } = useUser()
  const profile = useSellerProfile(user?.id)

  // Wired to real numbers once the seller-deals store exists (Phase 2) —
  // every seller starts with an empty portfolio either way.
  const activeOffers  = 0
  const buyersJoined  = 0
  const revenue       = 0

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-extrabold text-[#002356] text-2xl">
            Welcome, {profile?.companyName ?? "there"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s how your group buy offers are doing.</p>
        </div>
        <Link
          href="/sellers/dashboard/deals/new"
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: "#048943" }}
        >
          <PlusCircle className="h-4 w-4" />
          New Offer
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Active offers" value={activeOffers} icon={PackageCheck} />
        <StatCard label="Buyers joined" value={buyersJoined} sub="across all offers" icon={Users} />
        <StatCard label="Revenue" value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(revenue)} sub="from closed offers" icon={DollarSign} />
      </div>

      {activeOffers === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="flex justify-center mb-4">
            <TrendingUp className="h-14 w-14 text-gray-200" />
          </div>
          <h3 className="font-bold text-gray-700 text-lg mb-1">Create your first offer</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Set a retail price, a target discount, and a closing date — Groupal handles the rest, from the
            countdown to the final charge.
          </p>
          <Link
            href="/sellers/dashboard/deals/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
            style={{ backgroundColor: "#048943" }}
          >
            <PlusCircle className="h-4 w-4" />
            Create a Group Buy Offer
          </Link>
        </div>
      )}
    </>
  )
}
