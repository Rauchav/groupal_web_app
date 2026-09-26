"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { Clock, Users, LayoutList } from "lucide-react"
import { toast } from "sonner"
import { useParticipationStore, useEnsureParticipationsLoaded, MockParticipation } from "@/buyers/stores/participation-store"
import { useIsSeller } from "@/sellers/stores/seller-store"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import { OpenDealPaymentSummary, ClosedDealPaymentSummary, PaymentIssuePaymentSummary, MilestoneScale } from "@/buyers/components/dashboard/DealPaymentSummary"
import { ExpandableDescription } from "@/buyers/components/dashboard/ExpandableDescription"
import { DealReachBadge } from "@/components/deal-reach-badge"
import { DashboardSidebar, DashboardMobileTabs } from "@/buyers/components/dashboard/DashboardNav"
import { CountdownTimer } from "@/buyers/components/marketplace/CountdownTimer"
import { format } from "date-fns"

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "active" | "payment_issue" | "completed" | "forfeited" }) {
  if (status === "active") return (
    <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
      In Progress
    </span>
  )
  if (status === "payment_issue") return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(232,99,0,0.12)", color: "#e86300" }}>
      Payment Issue
    </span>
  )
  if (status === "completed") return (
    <span className="inline-block px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
      Completed ✓
    </span>
  )
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
      Reservation Forfeited
    </span>
  )
}

// ── Participation card ────────────────────────────────────────────────────────

function ParticipationCard({ p }: { p: MockParticipation }) {
  const deal = p.deal
  const computed = computeDealValues(deal)
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: deal.currency ?? "USD", minimumFractionDigits: 2 }).format(n)

  function shareLink() {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/checkout/${deal!.id}`
      : `/checkout/${deal!.id}`
    navigator.clipboard.writeText(url).then(() => toast.success("Share link copied!"))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden">
          <Image src={deal.productImages[0]} alt={deal.productName} fill className="object-cover" sizes="80px" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="font-bold text-[#002356] text-sm leading-snug line-clamp-2">
            {deal.productName}
          </h3>
          {deal.productDescription && (
            <ExpandableDescription text={deal.productDescription} className="text-xs text-gray-500 leading-snug" />
          )}
          <StatusBadge status={p.status} />
          {deal.reach && <DealReachBadge reach={deal.reach} className="text-xs text-gray-400" />}
          {(p.status === "active" || p.status === "payment_issue" || p.status === "completed") && (
            <p className="text-xs text-gray-400">Joined in {format(new Date(p.joinedAt), "MMMM d, yyyy")}</p>
          )}
          {p.status === "forfeited" && (
            <>
              <p className="text-xs text-gray-400">Joined {format(new Date(p.joinedAt), "MMM d, yyyy")}</p>
              <p className="text-xs text-gray-500">
                Paid: <span className="font-semibold text-gray-700">{fmt(p.reservationPaid)}</span>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100">
        {p.status === "active" && (
          <>
            <div className="px-4 pt-3 pb-3 space-y-3">
              <MilestoneScale deal={deal} />

              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Users className="h-3.5 w-3.5" />
                <span>
                  <span className="font-bold text-gray-700">{deal.currentBuyerCount}</span>
                  {" of "}
                  <span className="font-bold text-gray-700">{deal.maxBuyersRequired}</span>
                  {" buyers participating"}
                </span>
                <span className="font-bold text-[#DA1200] ml-auto">{computed.currentDiscountPercent.toFixed(1)}% off</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5 text-[#e86300]" />
                <span>Ends in:</span>
                <CountdownTimer targetDate={deal.deadlineAt} compact className="text-xs" />
              </div>
            </div>
            <OpenDealPaymentSummary deal={deal} reservationPaid={p.reservationPaid} deliveryCost={p.deliveryCost} onShare={shareLink} />
          </>
        )}

        {p.status === "payment_issue" && (
          <PaymentIssuePaymentSummary
            participationId={p.id}
            deal={deal}
            reservationPaid={p.reservationPaid}
            deliveryCost={p.deliveryCost}
            graceDeadline={p.graceDeadline}
          />
        )}

        {p.status === "completed" && (
          <ClosedDealPaymentSummary deal={deal} reservationPaid={p.reservationPaid} deliveryCost={p.deliveryCost} />
        )}

        {p.status === "forfeited" && (
          <div className="px-4 py-3 space-y-2">
            <p className="text-sm text-gray-500">
              Your reservation was forfeited. We&apos;re sorry it didn&apos;t work out this time.
            </p>
            <Link
              href="/deals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#002356] hover:underline"
            >
              Browse new deals →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const router = useRouter()
  const { user } = useUser()
  const isSeller = useIsSeller()
  // Gate on hasHydrated so the first client render matches the server's
  // always-empty SSR state — otherwise the real (fetched) list vs. the
  // empty state below diverge and React throws a hydration mismatch.
  const hasHydrated = useParticipationStore((s) => s.hasHydrated)
  const participationsStore = useParticipationStore((s) => s.participations)
  const refresh = useParticipationStore((s) => s.refresh)
  const markClosedViewed = useParticipationStore((s) => s.markClosedViewed)
  useEnsureParticipationsLoaded(user?.id)
  const participations = hasHydrated ? participationsStore : []

  // No real job scheduler yet (see app/api/jobs/sweep) — check on every
  // load whether any of this buyer's active deals are ready to close, and
  // if so run the close job and re-fetch this buyer's participations to
  // reflect the outcome here.
  useEffect(() => {
    if (!user?.id) return
    fetch("/api/jobs/sweep", { method: "POST" }).then(() => refresh()).catch(() => {})
  }, [user?.id, refresh])

  // Clears the "Purchases" nav badge — the buyer has now actually looked
  // at whatever closed since their last visit here.
  useEffect(() => {
    if (hasHydrated) markClosedViewed()
  }, [hasHydrated, markClosedViewed])

  // Same reasoning as app/(buyers)/dashboard/page.tsx's own guard: this page
  // is normally only reachable via a click that SellerViewOnlyGuard already
  // intercepts, but a direct URL visit would otherwise send a seller into
  // their own buyer purchase history. Comes after every other hook in this
  // component, never around one — conditionally skipping a hook call
  // itself would violate the Rules of Hooks.
  useEffect(() => {
    if (isSeller) router.replace("/sellers/dashboard")
  }, [isSeller, router])

  if (isSeller) return null

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f8f9fa", paddingTop: "7.5rem", paddingBottom: "4rem" }}>
      <div className="max-w-[1100px] mx-auto px-4">
        <DashboardMobileTabs active="/dashboard/purchases" />

        <div className="flex gap-6">
          <DashboardSidebar active="/dashboard/purchases" />

          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-[#002356] text-2xl">
                All Purchases
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Every group buy you&apos;ve joined, past and present.
              </p>
            </div>

            {participations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="flex justify-center mb-4">
                  <LayoutList className="h-14 w-14 text-gray-200" />
                </div>
                <h3 className="font-bold text-gray-700 text-lg mb-1">No purchases yet</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Join a group buy to see your purchase history here.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {participations.map((p) => (
                  <ParticipationCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
