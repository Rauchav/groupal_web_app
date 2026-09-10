"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getMockDealById } from "@/lib/mock/deals"
import { SuccessCelebration } from "@/components/success-celebration"

const REDIRECT_TARGET = "/dashboard" // "My Group Buys"

// ── Inner page (uses useSearchParams, must be inside Suspense) ───────────────

function CheckoutSuccessInner() {
  const searchParams = useSearchParams()
  const dealId       = searchParams.get("dealId") ?? ""
  const deal         = getMockDealById(dealId)

  return (
    <SuccessCelebration
      title="Congratulations on your purchase!"
      description={
        <>
          {deal
            ? `Your spot for ${deal.productName} is reserved. `
            : "Your spot is reserved. "}
          Now wait for the deal to close and see how much you saved with Groupal.
        </>
      }
      ctaLabel="Let's see my deal status"
      ctaHref={REDIRECT_TARGET}
    />
  )
}

// ── Page export (wraps inner in Suspense for useSearchParams) ─────────────────

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#002356]/60 backdrop-blur-sm">
        <div className="text-center text-white text-sm">Loading...</div>
      </main>
    }>
      <CheckoutSuccessInner />
    </Suspense>
  )
}
