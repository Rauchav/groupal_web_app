"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  NotificationRecord,
  NotificationType,
  Participation,
  PaymentRecord,
  PaymentStatus,
} from "@/lib/types/payment"

// Mock persistence layer — mirrors the Prisma models (GroupBuyParticipation,
// Payment, Notification) field-for-field. This is the module to swap for
// real Prisma queries once the app talks to Postgres/Supabase; every
// function here should map to a single Prisma call. Callers in
// lib/payments/ and lib/jobs/ never touch the underlying store directly.
//
// Backed by a persisted Zustand store (same pattern as participation-store
// and likes-store) rather than plain module-level arrays: Next.js doesn't
// guarantee a plain in-memory singleton stays the same object across
// route/chunk boundaries, so without localStorage-backed persistence data
// written on one page (e.g. a reservation charge during checkout) could
// silently be invisible on the next (e.g. the notifications page).

interface PaymentsDbState {
  participations: Participation[]
  payments: PaymentRecord[]
  notifications: NotificationRecord[]
  idCounter: number
}

// ISO-8601-shaped strings survive JSON.stringify but not JSON.parse — this
// reviver converts them back into real Date objects on rehydration so
// createdAt/updatedAt/graceDeadline etc. keep working as Dates everywhere
// they're consumed (deal-close-job, the notifications page, ...).
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
const storage = createJSONStorage<PaymentsDbState>(() => localStorage, {
  reviver: (_key, value) => (typeof value === "string" && ISO_DATE_RE.test(value) ? new Date(value) : value),
})

const initialState: PaymentsDbState = {
  participations: [],
  payments: [],
  notifications: [],
  idCounter: 0,
}

const usePaymentsDbStore = create<PaymentsDbState>()(
  persist(() => initialState, { name: "groupal-payments-db", storage })
)

function nextId(prefix: string): string {
  const { idCounter } = usePaymentsDbStore.getState()
  usePaymentsDbStore.setState({ idCounter: idCounter + 1 })
  return `${prefix}_${idCounter + 1}_${Date.now().toString(36)}`
}

export const paymentsDb = {
  createParticipation(
    input: Omit<Participation, "id" | "createdAt" | "updatedAt" | "retryAttempts"> & { retryAttempts?: number },
  ): Participation {
    const now = new Date()
    const participation: Participation = {
      ...input,
      retryAttempts: input.retryAttempts ?? 0,
      id: nextId("part"),
      createdAt: now,
      updatedAt: now,
    }
    usePaymentsDbStore.setState((s) => ({ participations: [...s.participations, participation] }))
    return participation
  },

  getParticipation(id: string): Participation | undefined {
    return usePaymentsDbStore.getState().participations.find((p) => p.id === id)
  },

  getParticipationByDealAndBuyer(dealId: string, buyerId: string): Participation | undefined {
    return usePaymentsDbStore.getState().participations.find((p) => p.dealId === dealId && p.buyerId === buyerId)
  },

  listParticipationsByBuyer(buyerId: string): Participation[] {
    return usePaymentsDbStore.getState().participations.filter((p) => p.buyerId === buyerId)
  },

  listParticipationsByDeal(dealId: string): Participation[] {
    return usePaymentsDbStore.getState().participations.filter((p) => p.dealId === dealId)
  },

  listParticipationsByDealAndStatus(dealId: string, status: PaymentStatus): Participation[] {
    return usePaymentsDbStore.getState().participations.filter((p) => p.dealId === dealId && p.status === status)
  },

  updateParticipation(id: string, patch: Partial<Omit<Participation, "id" | "createdAt">>): Participation {
    const { participations } = usePaymentsDbStore.getState()
    const idx = participations.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error(`Participation ${id} not found`)
    const updated = { ...participations[idx], ...patch, updatedAt: new Date() }
    const next = [...participations]
    next[idx] = updated
    usePaymentsDbStore.setState({ participations: next })
    return updated
  },

  createPayment(input: Omit<PaymentRecord, "id" | "createdAt">): PaymentRecord {
    const record: PaymentRecord = { ...input, id: nextId("pay"), createdAt: new Date() }
    usePaymentsDbStore.setState((s) => ({ payments: [...s.payments, record] }))
    return record
  },

  listPaymentsForParticipation(participationId: string): PaymentRecord[] {
    return usePaymentsDbStore.getState()
      .payments.filter((p) => p.participationId === participationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  },

  createNotification(input: {
    userId: string
    type: NotificationType
    title: string
    message: string
    data?: Record<string, unknown>
  }): NotificationRecord {
    const record: NotificationRecord = { ...input, id: nextId("notif"), read: false, createdAt: new Date() }
    usePaymentsDbStore.setState((s) => ({ notifications: [...s.notifications, record] }))
    return record
  },

  listNotificationsForUser(userId: string): NotificationRecord[] {
    return usePaymentsDbStore.getState()
      .notifications.filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  markNotificationRead(id: string): void {
    usePaymentsDbStore.setState((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  },

  markAllNotificationsRead(userId: string): void {
    usePaymentsDbStore.setState((s) => ({
      notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
    }))
  },

  // Test/demo helper only — not part of the swappable repository contract.
  __reset(): void {
    usePaymentsDbStore.setState({ participations: [], payments: [], notifications: [], idCounter: 0 })
  },
}
