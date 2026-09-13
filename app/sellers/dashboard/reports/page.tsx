"use client"

import { useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { format, subDays, startOfYear } from "date-fns"
import {
  DollarSign, TrendingUp, Users, PackageCheck, CheckCircle2,
  ChevronDown, BarChart3,
} from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"
import { useSellerDeals } from "@/sellers/stores/seller-deals-store"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"
import { cn } from "@/lib/utils"
import type { Deal } from "@/lib/types/deal"

// A first, deliberately simple pass at a sales-reporting view — real KPI
// cards, real filters, real (hand-drawn, no charting library added yet)
// charts, and a real per-deal table, all computed from this seller's own
// deals. Built as a base to escalate from later (more chart types, saved
// filter presets, CSV export, etc.) rather than a finished product — see
// the note on `cityOf()` below for the one piece of data this can't do
// properly yet.

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

const DATE_PRESETS = ["All time", "Last 30 days", "Last 90 days", "This year"] as const
type DatePreset = (typeof DATE_PRESETS)[number]

const STATUS_OPTIONS = ["All statuses", "Active", "Closed"] as const
type StatusOption = (typeof STATUS_OPTIONS)[number]

const CHART_COLORS = ["#eaad00", "#e86300", "#048943", "#1b4487", "#6B7A99", "#DA1200"]

// Deal.reach (lib/types/deal.ts) now carries the real per-deal city/country/
// continent a seller picks at creation, but the region-matching rules that
// data is meant to power haven't been defined yet, so this report still
// groups every one of a seller's deals under their own registered city
// (SellerProfile.city) rather than reading deal.reach. Swap this for a real
// read of deal.reach once that matching logic exists — every filter/chart
// below already reads through this function rather than deal.* directly,
// so nothing else here would need to change.
function cityOf(_deal: Deal, sellerCity: string): string {
  return sellerCity || "Unknown"
}

interface SalesRow {
  deal: Deal
  city: string
  grossRevenue: number
  commission: number
  netPayout: number
  discountPercent: number
}

function buildRow(deal: Deal, sellerCity: string): SalesRow {
  const computed = computeDealValues(deal)
  const isClosed = deal.status === "completed"
  // Matches app/sellers/dashboard/page.tsx's own "Revenue" stat exactly —
  // an active deal's buyers have only paid the 10% reservation so far, so
  // it contributes nothing to gross revenue until it actually closes.
  const grossRevenue = isClosed ? computed.currentPrice * deal.currentBuyerCount : 0
  const commission = isClosed ? computed.sellerPlatformFeeAmount : 0
  return {
    deal,
    city: cityOf(deal, sellerCity),
    grossRevenue,
    commission,
    netPayout: grossRevenue - commission,
    discountPercent: computed.currentDiscountPercent,
  }
}

function StatCard({ label, value, sub, icon: Icon, className }: { label: string; value: string | number; sub?: string; icon: React.ElementType; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm p-4", className)}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <Icon className="h-3.5 w-3.5 text-gray-300" />
      </div>
      <p className="font-extrabold text-[#002356] text-2xl tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function FilterSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-9 pl-3 pr-8 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 outline-none focus:border-[#1b4487] appearance-none bg-white cursor-pointer min-w-[9rem]"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

export default function SellerReportsPage() {
  const { user } = useUser()
  const profile = useSellerProfile(user?.id)
  const allDeals = useSellerDeals(profile?.id)

  const [datePreset, setDatePreset] = useState<DatePreset>("All time")
  const [category, setCategory] = useState("All categories")
  const [city, setCity] = useState("All cities")
  const [status, setStatus] = useState<StatusOption>("All statuses")

  const rows = useMemo(
    () => allDeals.map((d) => buildRow(d, profile?.city ?? "Unknown")),
    [allDeals, profile?.city]
  )

  const categoryOptions = useMemo(
    () => ["All categories", ...Array.from(new Set(allDeals.map((d) => d.category))).sort()],
    [allDeals]
  )
  const cityOptions = useMemo(
    () => ["All cities", ...Array.from(new Set(rows.map((r) => r.city))).sort()],
    [rows]
  )

  const filteredRows = useMemo(() => {
    const cutoff =
      datePreset === "This year" ? startOfYear(new Date())
      : datePreset === "Last 30 days" ? subDays(new Date(), 30)
      : datePreset === "Last 90 days" ? subDays(new Date(), 90)
      : null
    return rows.filter((r) => {
      if (cutoff && r.deal.createdAt < cutoff) return false
      if (category !== "All categories" && r.deal.category !== category) return false
      if (city !== "All cities" && r.city !== city) return false
      if (status === "Active" && r.deal.status !== "active") return false
      if (status === "Closed" && r.deal.status !== "completed") return false
      return true
    }).sort((a, b) => b.deal.createdAt.getTime() - a.deal.createdAt.getTime())
  }, [rows, datePreset, category, city, status])

  const closedRows = filteredRows.filter((r) => r.deal.status === "completed")

  const totals = {
    totalDeals: filteredRows.length,
    closedDeals: closedRows.length,
    totalBuyers: filteredRows.reduce((s, r) => s + r.deal.currentBuyerCount, 0),
    grossRevenue: closedRows.reduce((s, r) => s + r.grossRevenue, 0),
    commission: closedRows.reduce((s, r) => s + r.commission, 0),
    netPayout: closedRows.reduce((s, r) => s + r.netPayout, 0),
  }

  // Gross revenue by month closed deals were created in, oldest first.
  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>()
    closedRows.forEach((r) => {
      const key = format(r.deal.createdAt, "MMM yyyy")
      map.set(key, (map.get(key) ?? 0) + r.grossRevenue)
    })
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
      .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())
  }, [closedRows])

  const revenueByCategory = useMemo(() => {
    const map = new Map<string, number>()
    closedRows.forEach((r) => {
      map.set(r.deal.category, (map.get(r.deal.category) ?? 0) + r.grossRevenue)
    })
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [closedRows])

  const maxMonthly = Math.max(1, ...revenueByMonth.map((m) => m.value))
  const totalCategoryRevenue = Math.max(1, revenueByCategory.reduce((s, c) => s + c.value, 0))

  if (allDeals.length === 0) {
    return (
      <SellerComingSoon
        icon={BarChart3}
        title="No sales data yet"
        description="Publish and close your first group buy deal to see revenue, commission, and payout reports here."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-[#002356] text-2xl">Sales Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revenue, commission, and payout across your deals — filterable by date, category, and city.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4">
        <FilterSelect label="Date range" value={datePreset} options={DATE_PRESETS} onChange={setDatePreset} />
        <FilterSelect label="Category" value={category} options={categoryOptions} onChange={setCategory} />
        <FilterSelect label="City" value={city} options={cityOptions} onChange={setCity} />
        <FilterSelect label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total deals" value={totals.totalDeals} icon={PackageCheck} />
        <StatCard label="Closed deals" value={totals.closedDeals} icon={CheckCircle2} />
        <StatCard label="Buyers joined" value={totals.totalBuyers} icon={Users} />
        <StatCard label="Gross revenue" value={fmt(totals.grossRevenue)} icon={DollarSign} />
        <div
          className="col-span-2 rounded-2xl p-4 flex flex-col items-center text-center"
          style={{ backgroundColor: "#002356" }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Net payout</p>
            <TrendingUp className="h-3.5 w-3.5 text-white/40" />
          </div>
          <p className="font-extrabold text-2xl tabular-nums" style={{ color: "#eaad00" }}>
            {fmt(totals.netPayout)}
          </p>
          <p className="text-xs text-white/50 mt-0.5">after commission</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-[3fr_2fr] gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-[#002356] text-sm mb-4">Revenue over time</h2>
          {revenueByMonth.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No closed deals in this range yet.</p>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {revenueByMonth.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-xs font-bold text-[#002356] tabular-nums">{fmt(m.value)}</span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{ height: `${Math.max(4, (m.value / maxMonthly) * 100)}%`, backgroundColor: "#1b4487" }}
                  />
                  <span className="text-[11px] text-gray-400 font-medium">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-[#002356] text-sm mb-4">Revenue by category</h2>
          {revenueByCategory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No closed deals in this range yet.</p>
          ) : (
            <div className="space-y-3">
              {revenueByCategory.map((c, i) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-600">{c.label}</span>
                    <span className="font-bold text-[#002356] tabular-nums">
                      {fmt(c.value)} · {Math.round((c.value / totalCategoryRevenue) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.value / totalCategoryRevenue) * 100}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deal-by-deal table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Deal</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">City</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide text-right">Buyers</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide text-right">Discount</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide text-right">Gross revenue</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide text-right">Commission</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide text-right">Net payout</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">No deals match these filters.</td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.deal.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-semibold text-[#002356] max-w-[220px] truncate">{r.deal.productName}</td>
                  <td className="px-4 py-3 text-gray-500">{r.deal.category}</td>
                  <td className="px-4 py-3 text-gray-500">{r.city}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-xs font-bold",
                        r.deal.status === "completed" ? "bg-[#048943]/10 text-[#048943]" : "bg-[#1b4487]/10 text-[#1b4487]"
                      )}
                    >
                      {r.deal.status === "completed" ? "Closed" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">{r.deal.currentBuyerCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">{r.discountPercent.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#002356]">
                    {r.deal.status === "completed" ? fmt(r.grossRevenue) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                    {r.deal.status === "completed" ? fmt(r.commission) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-[#048943]">
                    {r.deal.status === "completed" ? fmt(r.netPayout) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
