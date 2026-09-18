"use client"

import { useEffect } from "react"
import { create } from "zustand"
import type { NotificationRecord } from "@/lib/types/payment"

// In-memory (not persisted) cache of the signed-in account's own
// notifications, backed by GET/PATCH /api/notifications*. Real-DB
// replacement for lib/mock/payments-db.ts's reactive notification slice —
// shared by the buyer and seller Notifications pages and both portals'
// nav badges, so a mark-read anywhere updates the unread count everywhere
// reactively, same as the mock version did.
interface NotificationsState {
  notifications: NotificationRecord[]
  loaded: boolean
  loading: boolean
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  loaded: false,
  loading: false,
  async refresh() {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const { notifications } = await res.json()
        set({ notifications, loaded: true })
      }
    } finally {
      set({ loading: false })
    }
  },
  async markRead(id) {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {})
  },
  async markAllRead() {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {})
  },
}))

// Triggers the initial fetch the first time any consumer needs it.
export function useEnsureNotificationsLoaded(userId: string | null | undefined) {
  const loaded = useNotificationsStore((s) => s.loaded)
  const refresh = useNotificationsStore((s) => s.refresh)
  useEffect(() => {
    if (userId && !loaded) void refresh()
  }, [userId, loaded, refresh])
}

// Same signature as the old lib/mock/payments-db.ts export — a live unread
// count, not an "unseen since last visit" one (see that file's own
// original comment for why: NotificationsPage tracks read/unread per item
// and only flips it on an explicit click or "Mark all as read", so simply
// opening the page must not clear this the way visiting the other two
// dashboard pages clears theirs).
export function useUnreadNotificationsCount(userId: string | null | undefined): number {
  useEnsureNotificationsLoaded(userId)
  const notifications = useNotificationsStore((s) => s.notifications)
  if (!userId) return 0
  return notifications.filter((n) => !n.read).length
}
