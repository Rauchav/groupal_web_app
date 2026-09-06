"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser, useClerk } from "@clerk/nextjs"
import {
  ChevronDown, LayoutDashboard, PackageCheck, PackageX, BarChart3, Bell, Settings, LogOut,
} from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"

// The seller portal's own top bar — deliberately not a shared/branching
// component with components/layout/Navbar.tsx (the buyer navbar). That
// one file trying to serve both portals via pathname checks was exactly
// the "mixing" this separation is meant to fix. Rendered once, in
// app/sellers/layout.tsx, for the whole /sellers/** tree.
const ACCOUNT_LINKS = [
  { href: "/sellers/dashboard",               icon: LayoutDashboard, label: "Dashboard" },
  { href: "/sellers/dashboard/deals",         icon: PackageCheck,    label: "Active Offers" },
  { href: "/sellers/dashboard/deals/closed",  icon: PackageX,        label: "Closed Offers" },
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-groupal-navy" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/sellers" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-groupal-gold rounded-lg">
            <Image src="/brand/isotipo1.svg" alt="Groupal" width={28} height={28} className="h-7 w-auto" />
            <span className="font-heading font-extrabold text-white text-sm tracking-wide hidden sm:block">
              Groupal <span style={{ color: "#eaad00" }}>for Business</span>
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
                      onClick={() => { setMenuOpen(false); signOut(); }}
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
            <span className="text-white/60 text-sm font-semibold">For Companies</span>
          )}
        </div>
      </div>
    </header>
  )
}
