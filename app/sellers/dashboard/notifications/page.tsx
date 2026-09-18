"use client"

import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { formatDistanceToNow } from "date-fns"
import { Bell, PlusCircle } from "lucide-react"
import { useNotificationsStore, useEnsureNotificationsLoaded } from "@/lib/notifications/notifications-store"
import { NOTIFICATION_STYLE } from "@/lib/notifications/style"
import type { NotificationRecord } from "@/lib/types/payment"

// Mirrors app/(buyers)/dashboard/notifications/page.tsx's NotificationRow —
// same NotificationRecord shape, same read/unread treatment, just no
// buyer-specific styling assumptions. Kept as its own component (not a
// shared one) per this app's buyer/sellers portal separation — see
// sellers/components/SellerNavbar.tsx's own note on why that split is
// deliberate.
function NotificationRow({ n, onRead }: { n: NotificationRecord; onRead: (id: string) => void }) {
  const style = NOTIFICATION_STYLE[n.type]
  const Icon = style.icon
  const dealId = typeof n.data?.dealId === "string" ? n.data.dealId : undefined

  return (
    <div
      onClick={() => !n.read && onRead(n.id)}
      className={`flex gap-3.5 p-4 rounded-2xl border transition-colors cursor-pointer ${
        n.read ? "bg-white border-gray-100" : "bg-[#eaad00]/[0.06] border-[#eaad00]/30"
      }`}
    >
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${style.bg}1a` }}
      >
        <Icon className="h-4 w-4" style={{ color: style.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="font-bold text-[#002356] text-sm leading-snug">{n.title}</p>
          {!n.read && <span className="mt-1 h-2 w-2 rounded-full bg-[#eaad00] flex-shrink-0" />}
        </div>
        <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </span>
          {dealId && (
            <Link
              href={`/sellers/dashboard/deals/${dealId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-semibold text-[#1b4487] hover:underline"
            >
              View deal →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SellerNotificationsPage() {
  const { user } = useUser()
  useEnsureNotificationsLoaded(user?.id)
  const notifications = useNotificationsStore((s) => s.notifications)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-[#002356] text-2xl">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex-shrink-0 text-sm font-semibold text-[#1b4487] hover:text-[#002356] hover:underline transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="flex justify-center mb-4">
            <Bell className="h-14 w-14 text-gray-200" />
          </div>
          <h3 className="font-bold text-gray-700 text-lg mb-1">No notifications yet</h3>
          <p className="text-gray-400 text-sm mb-6">
            Publish a deal and we&apos;ll let you know here whenever something about it changes — new
            buyers, when it closes, and when your payout lands.
          </p>
          <Link
            href="/sellers/dashboard/deals/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
            style={{ backgroundColor: "#048943" }}
          >
            <PlusCircle className="h-4 w-4" />
            Create a Deal
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} onRead={markRead} />
          ))}
        </div>
      )}
    </>
  )
}
