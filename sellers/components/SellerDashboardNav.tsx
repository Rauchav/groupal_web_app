"use client"

import Link from "next/link"
import { LayoutDashboard, PackageCheck, PackageX, PlusCircle, BarChart3, Bell, Settings, ShoppingCart } from "lucide-react"

const NAV_ITEMS = [
  { href: "/sellers/dashboard",               icon: LayoutDashboard, label: "Dashboard" },
  { href: "/sellers/dashboard/deals",         icon: PackageCheck,    label: "Active Offers" },
  { href: "/sellers/dashboard/deals/closed",  icon: PackageX,        label: "Closed Offers" },
  { href: "/sellers/dashboard/reports",       icon: BarChart3,       label: "Reports" },
  { href: "/sellers/dashboard/notifications", icon: Bell,            label: "Notifications" },
  { href: "/sellers/dashboard/settings",      icon: Settings,        label: "Settings" },
] as const

// Desktop sidebar — same shell as the buyer DashboardSidebar
// (components/dashboard/DashboardNav.tsx), plus a highlighted "New Offer"
// CTA since creating an offer is the seller portal's core action.
export function SellerDashboardSidebar({ active }: { active: string }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 gap-3">
      <Link
        href="/sellers/dashboard/deals/new"
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white transition-colors"
        style={{ backgroundColor: "#048943" }}
      >
        <PlusCircle className="h-4 w-4" />
        New Offer
      </Link>

      <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
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
            Buyers portal
          </Link>
        </div>
      </nav>
    </aside>
  )
}

// Mobile tab strip — same tabs, plus the marketplace escape hatch.
export function SellerDashboardMobileTabs({ active }: { active: string }) {
  return (
    <div className="flex lg:hidden gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 mb-4 overflow-x-auto">
      {NAV_ITEMS.map(({ href, label }) => (
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
      <Link
        href="/deals"
        className="flex-shrink-0 flex items-center gap-1.5 text-center py-2 rounded-xl text-sm font-semibold whitespace-nowrap px-3 text-gray-400 hover:text-[#002356] transition-colors"
      >
        <ShoppingCart className="h-3.5 w-3.5 flex-shrink-0" />
        Buyers portal
      </Link>
    </div>
  )
}
