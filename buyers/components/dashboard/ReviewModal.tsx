"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/buyers/components/marketplace/StarRating"
import type { DealReview } from "@/lib/types/review"

export function ReviewModal({
  open,
  onOpenChange,
  dealName,
  existingReview,
  onSubmit,
}: {
  open:            boolean
  onOpenChange:    (open: boolean) => void
  dealName:        string
  existingReview?: DealReview
  onSubmit:        (rating: number, comment: string) => void
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? "")

  // The trigger button lives outside this component and flips `open`
  // directly on parent state (see ClosedDealPaymentSummary), so it never
  // calls onOpenChange(true) — that only fires when the Dialog itself
  // requests a change (Escape, overlay click, close button). Sync the form
  // from existingReview whenever the dialog transitions to open instead.
  useEffect(() => {
    if (open) {
      setRating(existingReview?.rating ?? 0)
      setComment(existingReview?.comment ?? "")
    }
  }, [open, existingReview])

  function handleSubmit() {
    if (rating === 0) {
      toast.error("Pick at least 1 star to submit your review.")
      return
    }
    onSubmit(rating, comment.trim())
    toast.success(existingReview ? "Your review was updated!" : "Thanks for your review!")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "#eaad00"}} />
            <DialogTitle className="font-bold text-[#002356] text-sm leading-snug line-clamp-2">
              {existingReview ? "EDIT YOUR REVIEW" : "LEAVE A REVIEW"}
            </DialogTitle>
          </div>
          <DialogDescription className="line-clamp-2">{dealName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex flex-col items-center gap-2 py-2">
            <StarRating value={rating} onChange={setRating} size="lg" />
            <span className="text-xs font-semibold text-gray-400">
              {rating === 0 ? "Tap a star to rate" : `${rating} out of 5 stars`}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Tell other buyers how it went</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Worth the wait for the group discount, packaging was great, arrived on time..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors duration-150 cursor-pointer"
            style={{ backgroundColor: "#048943" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#036c35")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#048943")}
          >
            {existingReview ? "Update review" : "Submit review"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
