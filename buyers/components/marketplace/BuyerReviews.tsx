"use client"

import Image from "next/image"
import { motion, type Variants } from "framer-motion"
import { Quote } from "lucide-react"
import { useReviewsStore } from "@/buyers/stores/reviews-store"
import { getMockDealById } from "@/lib/mock/deals"
import { StarRating } from "@/buyers/components/marketplace/StarRating"

// Real buyer reviews collected from the "Review your purchase" CTA on
// closed deals (see components/dashboard/DealPaymentSummary.tsx). Reviews
// live in localStorage (lib/stores/reviews-store.ts) alongside the rest of
// this app's mock data, so this strip only shows what's been reviewed from
// this browser — renders nothing until there's at least one review.
export function BuyerReviews({ variants, custom }: { variants?: Variants; custom?: number }) {
  const hasHydrated = useReviewsStore((s) => s.hasHydrated)
  const reviews = useReviewsStore((s) => s.reviews)

  if (!hasHydrated || reviews.length === 0) return null

  const sorted = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <motion.div variants={variants} custom={custom} className="mt-10">
      <h3 className="font-heading font-extrabold text-groupal-navy text-lg text-center mb-5">
        What Buyers Are Saying
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.slice(0, 6).map((review) => {
          const deal = getMockDealById(review.dealId)
          return (
            <div
              key={review.id}
              className="relative flex flex-col gap-2.5 rounded-2xl bg-white border border-gray-100 shadow-card p-4"
            >
              <Quote className="absolute top-3 right-3 h-6 w-6 text-gray-100" />
              <StarRating value={review.rating} size="sm" />
              {review.comment && (
                <p className="text-sm text-gray-600 leading-snug line-clamp-4">&ldquo;{review.comment}&rdquo;</p>
              )}
              <div className="flex items-center gap-2.5 mt-1 pt-2.5 border-t border-gray-50">
                {deal && (
                  <div className="relative h-8 w-8 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image src={deal.productImage} alt={deal.productName} fill className="object-cover" sizes="32px" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-groupal-navy truncate">{review.buyerName}</p>
                  {deal && <p className="text-[11px] text-gray-400 truncate">{deal.productName}</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
