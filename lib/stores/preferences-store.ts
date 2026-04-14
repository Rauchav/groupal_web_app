"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface NotificationPreferences {
  emailNewBuyer: boolean
  emailEndingSoon: boolean
  emailDealCompleted: boolean
  emailPaymentReminders: boolean
  pushBuyerUpdates: boolean
  pushCountdownAlerts: boolean
}

interface PreferencesStore {
  notifications: NotificationPreferences
  setNotification: (key: keyof NotificationPreferences, value: boolean) => void
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      notifications: {
        emailNewBuyer: true,
        emailEndingSoon: true,
        emailDealCompleted: true,
        emailPaymentReminders: true,
        pushBuyerUpdates: false,
        pushCountdownAlerts: false,
      },
      setNotification: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),
    }),
    { name: "groupal-preferences" }
  )
)
