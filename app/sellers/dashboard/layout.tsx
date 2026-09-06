"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useSellerStore, useSellerProfile } from "@/sellers/stores/seller-store"
import { SellerDashboardSidebar, SellerDashboardMobileTabs } from "@/sellers/components/SellerDashboardNav"

// Middleware (middleware.ts) already bounces a fully signed-out visitor to
// /sellers before this ever renders. What middleware can't see is the mock
// seller profile — that's client-only localStorage (lib/stores/seller-store.ts)
// — so this layout is what catches "signed in, but never finished company
// onboarding" and sends them back to /sellers to complete it.
export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const profile     = useSellerProfile(user?.id)
  const hasHydrated = useSellerStore((s) => s.hasHydrated)

  useEffect(() => {
    if (!isLoaded || !hasHydrated) return
    if (!isSignedIn || !profile) {
      router.replace(`/sellers?redirect_url=${encodeURIComponent(pathname)}`)
    }
  }, [isLoaded, isSignedIn, hasHydrated, profile, pathname, router])

  if (!isLoaded || !hasHydrated || !isSignedIn || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-[#002356] animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f8f9fa", paddingTop: "7.5rem", paddingBottom: "4rem" }}>
      <div className="max-w-[1100px] mx-auto px-4">
        <SellerDashboardMobileTabs active={pathname} />
        <div className="flex gap-6">
          <SellerDashboardSidebar active={pathname} />
          <div className="flex-1 min-w-0 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}
