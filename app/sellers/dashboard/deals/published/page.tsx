"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useApiGet } from "@/lib/api/use-fetch"
import type { ApiDeal } from "@/lib/api/deal-adapter"
import { SuccessCelebration } from "@/components/success-celebration"

function DealPublishedInner() {
  const searchParams = useSearchParams()
  const dealId       = searchParams.get("dealId") ?? ""
  const { data }     = useApiGet<{ deal: ApiDeal }>(dealId ? `/api/deals/${dealId}` : null)
  const deal         = data?.deal

  return (
    <SuccessCelebration
      title="Your deal is live!"
      description={
        <>
          {deal ? deal.productName : "Your deal"} is now visible to thousands of buyers in the
          Groupal marketplace. We&apos;ll keep you posted as buyers join and the group discount grows.
        </>
      }
      ctaLabel="View my deal"
      ctaHref={dealId ? `/sellers/dashboard/deals/${dealId}` : "/sellers/dashboard/deals"}
    />
  )
}

export default function DealPublishedPage() {
  return (
    <Suspense fallback={
      <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#002356]/60 backdrop-blur-sm">
        <div className="text-center text-white text-sm">Loading...</div>
      </main>
    }>
      <DealPublishedInner />
    </Suspense>
  )
}
