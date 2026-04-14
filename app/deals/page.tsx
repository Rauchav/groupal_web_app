"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Zap, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { DealCard, DealCardSkeleton } from "@/components/marketplace/DealCard"
import { LikeButton } from "@/components/marketplace/LikeButton"
import { MOCK_DEALS } from "@/lib/mock/deals"
import { cn } from "@/lib/utils"
import { Deal } from "@/lib/types/deal"

const CATEGORIES = [
  "All",
  "Electronics",
  "Cars & Motorcycles",
  "Computers",
  "Smartphones",
  "Furniture",
  "Travel",
  "Vacations",
] as const

type SortOption = "ending-soon" | "most-popular" | "biggest-discount" | "newest"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "ending-soon",       label: "Ending Soon" },
  { value: "most-popular",      label: "Most Popular" },
  { value: "biggest-discount",  label: "Biggest Discount" },
  { value: "newest",            label: "Newest" },
]

function dealMatchesCategory(deal: Deal, category: string): boolean {
  if (category === "All") return true
  const map: Record<string, string[]> = {
    "Cars & Motorcycles": ["Cars", "Motorcycles"],
    "Smartphones":        ["Cell Phones", "Smartphones"],
    "Furniture":          ["Furniture", "Home"],
    "Travel":             ["Travel"],
    "Vacations":          ["Vacations", "Travel"],
  }
  const aliases = map[category]
  if (aliases) return aliases.includes(deal.category)
  return deal.category === category
}

function sortDeals(deals: Deal[], sort: SortOption): Deal[] {
  return [...deals].sort((a, b) => {
    switch (sort) {
      case "ending-soon":
        return a.deadlineAt.getTime() - b.deadlineAt.getTime()
      case "most-popular":
        return b.currentBuyerCount - a.currentBuyerCount
      case "biggest-discount":
        return b.maxDiscountPercent - a.maxDiscountPercent
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime()
    }
  })
}

export default function DealsPage() {
  const [search,   setSearch]   = useState("")
  const [category, setCategory] = useState("All")
  const [sort,     setSort]     = useState<SortOption>("ending-soon")
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  const endingSoon = useMemo(
    () => MOCK_DEALS.filter((d) => {
      const hoursLeft = (d.deadlineAt.getTime() - Date.now()) / (1000 * 60 * 60)
      return hoursLeft > 0 && hoursLeft < 24
    }),
    []
  )

  const filtered = useMemo(() => {
    let result = MOCK_DEALS.filter((d) => {
      const matchesSearch = search.trim() === "" ||
        d.productName.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase()) ||
        d.sellerName.toLowerCase().includes(search.toLowerCase())
      const matchesCat = dealMatchesCategory(d, category)
      return matchesSearch && matchesCat
    })
    return sortDeals(result, sort)
  }, [search, category, sort])

  const activeFilterCount =
    (category !== "All" ? 1 : 0) + (sort !== "ending-soon" ? 1 : 0)

  return (
    <>
      <main className="min-h-screen bg-gray-50">

        {/* ── Page Header ─────────────────────────────────── */}
        <div style={{ backgroundColor: "#002356" }} className="pt-28 pb-10 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="font-heading font-extrabold text-white text-4xl md:text-5xl leading-tight">
              Active Group Buys
            </h1>
            <p className="mt-3 text-white/60 text-lg max-w-xl mx-auto">
              Join a group buy and watch the price drop as more buyers join
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-sm font-semibold">
                {MOCK_DEALS.length} active deals right now
              </span>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Bar ─────────────────────────── */}
        <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">

            {/* Search + Sort row */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search deals, products, categories..."
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1b4487] focus:ring-2 focus:ring-[#1b4487]/20 transition-all"
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 outline-none focus:border-[#1b4487] appearance-none bg-white cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Active filter badge */}
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold bg-[#002356] text-white">
                  {activeFilterCount}
                </span>
              )}
            </div>

            {/* Category chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap",
                    category === cat
                      ? "bg-[#002356] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

          {/* ── Ending Soon Banner ───────────────────────── */}
          {endingSoon.length > 0 && (
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ backgroundColor: "#e86300" }}
            >
              <Zap className="h-5 w-5 text-white flex-shrink-0" fill="white" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">
                  Ending in less than 24 hours — join now!
                </p>
                <p className="text-white/80 text-xs mt-0.5">
                  {endingSoon.map((d) => d.productName).join(" · ")}
                </p>
              </div>
            </div>
          )}

          {/* ── Deals Grid ──────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <DealCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="text-6xl">🔍</div>
              <h3 className="text-xl font-bold text-gray-700">No deals found</h3>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              <button
                onClick={() => { setSearch(""); setCategory("All"); }}
                className="mt-2 px-5 py-2 rounded-xl bg-[#002356] text-white text-sm font-semibold hover:bg-[#1b4487] transition-colors cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${category}-${search}-${sort}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filtered.map((deal) => (
                  <div key={deal.id} className="relative">
                    <a href={`/deals/${deal.id}`} className="block h-full">
                      <DealCard
                        deal={deal}
                        onJoin={() => window.location.href = `/deals/${deal.id}`}
                      />
                    </a>
                    {/* LikeButton overlaid on card image */}
                    <div className="absolute top-3 right-3 z-20">
                      <LikeButton dealId={deal.id} />
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── Load More ────────────────────────────────── */}
          {!loading && filtered.length > 0 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => toast.info("More deals coming soon!")}
                className="px-8 py-3 rounded-xl font-bold text-sm text-white cursor-pointer transition-colors"
                style={{ backgroundColor: "#002356" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1b4487")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#002356")}
              >
                Load more deals
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
