"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Mirrors the Prisma SellerProfile model's shape (see prisma/schema.prisma)
// without needing the DB — same mock-first pattern as
// lib/stores/participation-store.ts.
export interface SellerProfile {
  id:          string
  userId:      string
  companyName: string
  category:    string
  phone:       string
  city:        string
  website?:    string
  description?: string
  logoUrl?:    string
  verified:    boolean
  createdAt:   string
}

interface SellerStore {
  // Keyed by Clerk user id — localStorage is shared by every Google
  // account that ever signs in on this browser, so a single unkeyed
  // `profile` field would leak one signed-in identity's seller status
  // onto a completely different account after a sign-out/sign-in. This
  // was a real bug: switching Google accounts left the new account
  // treated as "already a seller" and permanently stuck in view-only mode
  // on the buyer portal.
  profilesByUserId: Record<string, SellerProfile>
  // True once this store's persisted state has been read back from
  // localStorage on the client. Always false during SSR and for the first
  // client render — components must not branch on profile data before
  // then, or the client's first paint diverges from the server-rendered
  // HTML.
  hasHydrated: boolean
  setHasHydrated: (hasHydrated: boolean) => void
  createProfile: (input: Omit<SellerProfile, "id" | "verified" | "createdAt">) => void
  updateProfile: (userId: string, patch: Partial<Omit<SellerProfile, "id" | "userId" | "createdAt">>) => void
  clearProfile: (userId: string) => void
}

export const useSellerStore = create<SellerStore>()(
  persist(
    (set) => ({
      profilesByUserId: {},
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      createProfile: (input) =>
        set((state) => ({
          profilesByUserId: {
            ...state.profilesByUserId,
            [input.userId]: {
              ...input,
              id: `seller_${Date.now().toString(36)}`,
              verified: false,
              createdAt: new Date().toISOString(),
            },
          },
        })),
      updateProfile: (userId, patch) =>
        set((state) => {
          const existing = state.profilesByUserId[userId]
          if (!existing) return state
          return { profilesByUserId: { ...state.profilesByUserId, [userId]: { ...existing, ...patch } } }
        }),
      clearProfile: (userId) =>
        set((state) => {
          const { [userId]: _removed, ...rest } = state.profilesByUserId
          return { profilesByUserId: rest }
        }),
    }),
    {
      name: "groupal-seller-profile",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// The hook every component should use instead of reading
// useSellerStore((s) => s.profile) directly — ties the lookup to a
// specific Clerk user id so a different signed-in account never inherits
// someone else's seller status in this browser.
export function useSellerProfile(userId: string | null | undefined): SellerProfile | null {
  return useSellerStore((s) => (userId ? s.profilesByUserId[userId] ?? null : null))
}
