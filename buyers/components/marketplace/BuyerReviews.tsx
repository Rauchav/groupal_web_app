"use client"

import Image from "next/image"
import { motion, type Variants } from "framer-motion"
import { Quote } from "lucide-react"
import { useApiGet } from "@/lib/api/use-fetch"
import { StarRating } from "@/buyers/components/marketplace/StarRating"

interface ReviewWithDeal {
  id: string
  rating: number
  comment: string
  buyerName: string
  createdAt: string
  deal: { productName: string; productImages: string[] } | null
}

// Real buyer reviews collected from the "Review your purchase" CTA on
// closed deals (see components/dashboard/DealPaymentSummary.tsx), via the
// public GET /api/reviews feed — renders nothing until there's at least
// one review platform-wide.
export function BuyerReviews({ variants, custom }: { variants?: Variants; custom?: number }) {
  const { data } = useApiGet<{ reviews: ReviewWithDeal[] }>("/api/reviews?limit=6")
  const reviews = data?.reviews ?? []

  if (reviews.length === 0) return null

  return (
    <motion.div variants={variants} custom={custom} className="mt-10">
      <h3 className="font-heading font-extrabold text-groupal-navy text-lg text-center mb-5">
        What Buyers Are Saying
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review) => (
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
              {review.deal && (
                <div className="relative h-8 w-8 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image src={review.deal.productImages[0]} alt={review.deal.productName} fill className="object-cover" sizes="32px" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-groupal-navy truncate">{review.buyerName}</p>
                {review.deal && <p className="text-[11px] text-gray-400 truncate">{review.deal.productName}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
