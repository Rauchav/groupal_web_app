"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { ArrowLeft } from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"
import { SellerModeModal } from "./SellerModeModal"
import { useParticipationStore } from "@/buyers/stores/participation-store"
import { useLikesStore } from "@/buyers/stores/likes-store"

// Mounted once in app/(buyers)/layout.tsx, so it's only ever present on
// buyer routes — reached either by a seller directly visiting a buyer URL,
// or intentionally via the "Buyers Portal" link in the seller dashboard nav
// (sellers/components/SellerDashboardNav.tsx / SellerNavbar.tsx), built so
// a seller can see the marketplace exactly as a buyer would — deal cards,
// prices, competitors' offers, category/search/sort — but shouldn't be able
// to actually act as a buyer there (join/like a deal, click through the
// navbar, etc). Rather than gating every individual button across the buyer
// side, a capture-phase click listener sits above the whole page: any click
// pops the explainer modal instead of reaching whatever was underneath,
// UNLESS the clicked element (or an ancestor) opts back in with
// data-seller-view-ok — used by the handful of pure-browsing controls
// (category chips, search, sort/filter) sellers are allowed to use while
// just looking around. Listening in the capture phase means this runs
// before the click reaches its target, so it can stop the action outright
// rather than racing whatever handler is already there.
export function SellerViewOnlyGuard() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const sellerProfile = useSellerProfile(user?.id)
  const [modalOpen, setModalOpen] = useState(false)

  const isSeller = !!isSignedIn && !!sellerProfile

  // A Clerk account counts as "a buyer" the moment it's signed in anywhere
  // on the buyer portal — not only once it likes or joins a deal. Buyers
  // never have an explicit registration step of their own (unlike sellers,
  // who fill out OnboardingStep), so simply landing here signed in, without
  // a seller profile, IS that account's buyer registration. Excluding
  // isSeller keeps a seller's own view-only visits (SellerModeModal's
  // territory) from ever being counted as buyer activity. Real-DB version
  // of the old buyer-identity-store flag — requireUser() lazily creates the
  // User row if a webhook hasn't already, so this PATCH alone is enough to
  // both provision the row and set hasBuyerActivity in one call.
  useEffect(() => {
    if (!isSignedIn || !user || isSeller) return
    fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasBuyerActivity: true }),
    }).catch(() => {})
  }, [isSignedIn, user, isSeller])

  // Populates the shared likes/participations caches (DealCard's "Already
  // Joined" badge, LikeButton's filled heart, Navbar's liked-count badge)
  // once per session, and sweeps for deals that hit their deadline or max
  // buyer count — no real job scheduler yet, see app/api/jobs/sweep. This
  // guard mounts on every buyer route, so it's the one reliable place to
  // do both, the same way it used to be the one reliable place to sync
  // seller-created deals into the old mock catalog.
  const refreshParticipations = useParticipationStore((s) => s.refresh)
  const refreshLikes = useLikesStore((s) => s.refresh)
  useEffect(() => {
    if (!isSignedIn || !user || isSeller) return
    void refreshParticipations()
    void refreshLikes()
  }, [isSignedIn, user, isSeller, refreshParticipations, refreshLikes])

  useEffect(() => {
    fetch("/api/jobs/sweep", { method: "POST" }).catch(() => {})
  }, [])

  // Detached while the modal itself is open so its own buttons (and the
  // overlay's backdrop-click-to-close) work like any other dialog.
  useEffect(() => {
    if (!isSeller || modalOpen) return

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (target?.closest("[data-seller-view-ok]")) return
      e.preventDefault()
      e.stopPropagation()
      setModalOpen(true)
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [isSeller, modalOpen])

  if (!isSeller) return null

  return (
    <>
      {/* Always-visible way back — carries data-seller-view-ok itself, since
          it's a real click target the listener above would otherwise catch. */}
      <button
        data-seller-view-ok
        onClick={() => router.push("/sellers/dashboard")}
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,35,86,0.35)] cursor-pointer transition-transform hover:scale-105"
        style={{ backgroundColor: "#002356", border: "2px solid #eaad00" }}
      >
        <ArrowLeft className="h-4 w-4" style={{ color: "#eaad00" }} />
        Back to Sellers Portal
      </button>

      <SellerModeModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
