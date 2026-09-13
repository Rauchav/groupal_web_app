"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useUser } from "@clerk/nextjs"

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

// Cross-portal convenience for buyer-side code (same precedent as
// buyers/stores/buyer-identity-store.ts being read from the seller gate):
// combines useUser() + useSellerProfile() so any buyer-facing personalization
// read (a deal card's "Joined" badge, a liked heart, the dashboard pages)
// can gate on "is this signed-in account actually a seller?" the same way it
// already gates on isSignedIn. This matters because buyers/stores/
// participation-store.ts and likes-store.ts aren't scoped by Clerk user id
// at all (see participation-store.ts's own comment) — every signed-in
// visitor on this browser reads the same flat, unscoped array. Without this
// guard, a seller using "Buyers Portal" view-only browsing (sellers/
// components/SellerViewOnlyGuard.tsx) could see a completely different
// Clerk account's real "joined this deal" / "liked this deal" state, which
// is exactly the kind of buyer↔seller identity leak this app must not have.
export function useIsSeller(): boolean {
  const { isSignedIn, user } = useUser()
  const profile = useSellerProfile(user?.id)
  return !!isSignedIn && !!profile
}
