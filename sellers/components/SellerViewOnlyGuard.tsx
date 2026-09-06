"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { ArrowLeft } from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"
import { SellerModeModal } from "./SellerModeModal"

// Mounted once in app/(buyers)/layout.tsx, so it's only ever present on
// buyer routes — a seller ("Visit Groupal Buyers Portal" in
// components/sellers/SellerDashboardNav.tsx) can see the marketplace
// exactly as a buyer would — deal cards, prices, competitors' offers — but
// shouldn't be able to actually act as a buyer there (join/like a deal,
// click through the navbar, etc). Rather than gating every individual
// button across the buyer side, a capture-phase click listener sits above
// the whole page: any click pops the explainer modal instead of reaching
// whatever was underneath, UNLESS the clicked element (or an ancestor)
// opts back in with data-seller-view-ok — used by the handful of
// pure-browsing controls (category chips, search, sort/filter) sellers are
// allowed to use while just looking around. Listening in the capture phase
// means this runs before the click reaches its target, so it can stop the
// action outright rather than racing whatever handler is already there.
export function SellerViewOnlyGuard() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const sellerProfile = useSellerProfile(user?.id)
  const [modalOpen, setModalOpen] = useState(false)

  const isSeller = !!isSignedIn && !!sellerProfile

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
