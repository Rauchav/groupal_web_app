"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser, useClerk } from "@clerk/nextjs"
import {
  ChevronDown, LayoutDashboard, PackageCheck, PackageX, BarChart3, Bell, Settings, LogOut, ShieldCheck,
} from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"
import { useSellerDealsStore, useMockDealsSyncStore } from "@/sellers/stores/seller-deals-store"
import { addMockDeal } from "@/lib/mock/deals"
import { closeExpiredDeals } from "@/lib/payments/sync-deal-closures"

// The seller portal's own top bar — deliberately not a shared/branching
// component with components/layout/Navbar.tsx (the buyer navbar). That
// one file trying to serve both portals via pathname checks was exactly
// the "mixing" this separation is meant to fix. Rendered once, in
// app/sellers/layout.tsx, for the whole /sellers/** tree.
const ACCOUNT_LINKS = [
  { href: "/sellers/dashboard",               icon: LayoutDashboard, label: "Dashboard" },
  { href: "/sellers/dashboard/deals",         icon: PackageCheck,    label: "Active Deals" },
  { href: "/sellers/dashboard/deals/closed",  icon: PackageX,        label: "Closed Deals" },
  { href: "/sellers/dashboard/reports",       icon: BarChart3,       label: "Reports" },
  { href: "/sellers/dashboard/notifications", icon: Bell,            label: "Notifications" },
  { href: "/sellers/dashboard/settings",      icon: Settings,        label: "Settings" },
] as const

export function SellerNavbar() {
  const { isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const profile = useSellerProfile(user?.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const sellerDeals = useSellerDealsStore((s) => s.deals)
  const bumpMockDealsSync = useMockDealsSyncStore((s) => s.bump)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Same plain useState/useEffect "mounted" gate as
  // sellers/components/SellerViewOnlyGuard.tsx uses for this exact
  // purpose on the buyer side — see that file's comment for why gating on
  // zustand's own hasHydrated instead can land a MOCK_DEALS mutation
  // inside the first render and produce a hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // No real job scheduler yet — sweep for deals that hit their deadline or
  // max buyer count on every seller-portal page load, same mock stand-in
  // buyer pages already run (see app/(buyers)/page.tsx and
  // app/(buyers)/deals/page.tsx). Sellers might never visit a buyer page
  // in a session, so without this sweep here too, a deal could sit past
  // its deadline forever from the seller's point of view.
  //
  // A fresh page load resets the MOCK_DEALS module array back to just the
  // 8 seed deals — it's in-memory only, not persisted. A seller's own
  // created deals only rejoin it once addMockDeal below re-pushes them
  // from the persisted store, and it's essential that this happens BEFORE
  // closeExpiredDeals() runs: addMockDeal reuses these exact deal object
  // references, so mutating deal.status inside closeExpiredDeals (which
  // only iterates MOCK_DEALS) also mutates the very same objects sitting
  // in useSellerDealsStore's `deals` — which is what Active/Closed Deals
  // and their nav badges actually render from. Skip this re-linking step
  // and a seller's own deals would never close from their own portal.
  // Bumping the shared sync tick afterward is what makes those pages
  // actually recompute against the mutation — see useMockDealsSyncStore's
  // comment in sellers/stores/seller-deals-store.ts for why.
  useEffect(() => {
    if (!mounted) return
    sellerDeals.forEach(addMockDeal)
    closeExpiredDeals().then(() => bumpMockDealsSync())
  }, [mounted, sellerDeals, bumpMockDealsSync])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-groupal-navy" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/sellers" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-groupal-gold rounded-lg">
            <Image src="/brand/isotipo1.svg" alt="Groupal" width={1080} height={886.6} className="h-7 w-auto sm:hidden" />
            <Image src="/brand/logo fondo azul.svg" alt="Groupal" width={1057} height={262} className="hidden h-7 w-auto sm:block" />
            <span className="font-heading font-extrabold text-[#eaad00] groupal-gold text-sm tracking-wide hidden sm:block">
              for Business
            </span>
          </Link>

          {isSignedIn && profile ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-groupal-gold flex items-center justify-center text-groupal-navy font-bold text-xs flex-shrink-0">
                  {profile.companyName[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-semibold max-w-[120px] truncate">{profile.companyName}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden z-50">
                  {ACCOUNT_LINKS.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => { setMenuOpen(false); signOut({ redirectUrl: "/sellers" }); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1.5 text-white/60 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              100% secure platform
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
