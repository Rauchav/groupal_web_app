"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { formatDistanceToNow } from "date-fns"
import {
  Bell, CheckCircle2, TrendingDown, Clock, PartyPopper,
  CreditCard, AlertTriangle, BellRing,
} from "lucide-react"
import { DashboardSidebar, DashboardMobileTabs } from "@/components/dashboard/DashboardNav"
import { paymentsDb } from "@/lib/mock/payments-db"
import type { NotificationRecord, NotificationType } from "@/lib/types/payment"

// ── Per-type presentation — icon + accent color ────────────────────────────

const NOTIFICATION_STYLE: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  DEAL_JOINED:            { icon: CheckCircle2,  color: "#048943", bg: "#048943" },
  DEAL_PROGRESS:          { icon: TrendingDown,   color: "#1b4487", bg: "#1b4487" },
  DEAL_ENDING_SOON:       { icon: Clock,          color: "#e86300", bg: "#e86300" },
  DEAL_COMPLETED:         { icon: PartyPopper,    color: "#048943", bg: "#048943" },
  PAYMENT_SUCCESS:        { icon: CreditCard,     color: "#048943", bg: "#048943" },
  PAYMENT_FAILED:         { icon: AlertTriangle,  color: "#DA1200", bg: "#DA1200" },
  PAYMENT_REMINDER:       { icon: BellRing,       color: "#e86300", bg: "#e86300" },
  RESERVATION_FORFEITED:  { icon: AlertTriangle,  color: "#DA1200", bg: "#DA1200" },
  SELLER_NEW_BUYER:       { icon: TrendingDown,   color: "#1b4487", bg: "#1b4487" },
  SELLER_DEAL_COMPLETED:  { icon: PartyPopper,    color: "#048943", bg: "#048943" },
  SELLER_PAYOUT_SENT:     { icon: CreditCard,     color: "#048943", bg: "#048943" },
}

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
            {formatDistanceToNow(n.createdAt, { addSuffix: true })}
          </span>
          {dealId && (
            <Link
              href={`/checkout/${dealId}`}
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

export default function NotificationsPage() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])

  useEffect(() => {
    if (user?.id) setNotifications(paymentsDb.listNotificationsForUser(user.id))
  }, [user?.id])

  const unreadCount = notifications.filter((n) => !n.read).length

  function markRead(id: string) {
    paymentsDb.markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  function markAllRead() {
    if (!user?.id) return
    paymentsDb.markAllNotificationsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f8f9fa", paddingTop: "7.5rem", paddingBottom: "4rem" }}>
      <div className="max-w-[1100px] mx-auto px-4">
        <DashboardMobileTabs active="/dashboard/notifications" />

        <div className="flex gap-6">
          <DashboardSidebar active="/dashboard/notifications" />

          <div className="flex-1 min-w-0 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-extrabold text-[#002356] text-2xl">
                  Notifications
                </h1>
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
                  Join a group buy and we&apos;ll let you know here whenever something about it changes —
                  new buyers, payment reminders, and when the deal closes.
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
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <NotificationRow key={n.id} n={n} onRead={markRead} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
