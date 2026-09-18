"use client"

import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { ShoppingBag, Heart, Settings, LayoutList, Bell, ShoppingCart } from "lucide-react"
import { useUnseenGroupBuysCount, useUnseenClosedCount } from "@/buyers/stores/participation-store"
import { useUnreadNotificationsCount } from "@/lib/notifications/notifications-store"

const NAV_ITEMS = [
  { href: "/dashboard",               icon: ShoppingBag, label: "My Group Buys" },
  { href: "/dashboard/liked",         icon: Heart,        label: "Liked Deals" },
  { href: "/dashboard/purchases",     icon: LayoutList,   label: "Purchases" },
  { href: "/dashboard/notifications", icon: Bell,         label: "Notifications" },
  { href: "/dashboard/settings",      icon: Settings,     label: "Settings" },
] as const

const GROUP_BUYS_HREF   = "/dashboard"
const PURCHASES_HREF    = "/dashboard/purchases"
const NOTIFICATIONS_HREF = "/dashboard/notifications"

// Small orange count badge — same mechanic as the seller portal's
// Active/Closed Deals badges (sellers/components/SellerDashboardNav.tsx).
// Orange rather than red: CLAUDE.md reserves red specifically for
// warnings/errors/"ending soon", and none of these three are that.
function UnseenBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full text-white text-[10px] font-bold px-1" style={{ backgroundColor: "#e86300" }}>
      {count}
    </span>
  )
}

// The three counts each badge below needs. Pulled into one hook so both
// nav shells stay in sync without duplicating the useUser() call.
function useDashboardBadgeCounts() {
  const { user } = useUser()
  return {
    groupBuys:     useUnseenGroupBuysCount(),
    purchases:     useUnseenClosedCount(),
    notifications: useUnreadNotificationsCount(user?.id),
  }
}

// Desktop sidebar — shown on every page in the /dashboard/* section, always
// includes a way back out to the marketplace.
export function DashboardSidebar({ active }: { active: string }) {
  const counts = useDashboardBadgeCounts()

  return (
    <aside className="hidden lg:flex flex-col w-60 flex-shrink-0">
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
            <span className="flex-1">{label}</span>
            {href === GROUP_BUYS_HREF && <UnseenBadge count={counts.groupBuys} />}
            {href === PURCHASES_HREF && <UnseenBadge count={counts.purchases} />}
            {href === NOTIFICATIONS_HREF && <UnseenBadge count={counts.notifications} />}
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

// Mobile tab strip — same section tabs as the desktop sidebar, plus a
// "Marketplace" tab so there's always an intuitive way out on small screens
// too (previously only the desktop sidebar had this escape hatch).
export function DashboardMobileTabs({ active }: { active: string }) {
  const counts = useDashboardBadgeCounts()

  return (
    <div className="flex lg:hidden gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 mb-4 overflow-x-auto">
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`flex-1 flex items-center justify-center gap-1.5 text-center py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap px-3 ${
            active === href
              ? "bg-[#002356] text-white"
              : "text-gray-500 hover:text-[#002356]"
          }`}
        >
          {label}
          {href === GROUP_BUYS_HREF && <UnseenBadge count={counts.groupBuys} />}
          {href === PURCHASES_HREF && <UnseenBadge count={counts.purchases} />}
          {href === NOTIFICATIONS_HREF && <UnseenBadge count={counts.notifications} />}
        </Link>
      ))}
      <Link
        href="/deals"
        className="flex-shrink-0 flex items-center gap-1.5 text-center py-2 rounded-xl text-sm font-semibold whitespace-nowrap px-3 text-gray-400 hover:text-[#002356] transition-colors"
      >
        <ShoppingCart className="h-3.5 w-3.5 flex-shrink-0" />
        Marketplace
      </Link>
    </div>
  )
}
