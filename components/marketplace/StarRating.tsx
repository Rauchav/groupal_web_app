"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

// Interactive when onChange is passed (review form), read-only display
// otherwise (review cards). Scale is 0–5 whole stars.
export function StarRating({
  value,
  onChange,
  size = "md",
  className,
}: {
  value:     number
  onChange?: (rating: number) => void
  size?:     "sm" | "md" | "lg"
  className?: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const interactive = Boolean(onChange)
  const displayValue = hovered ?? value

  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6"

  return (
    <div className={cn("flex items-center gap-1", className)} role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange?.(star === value ? 0 : star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(null)}
          className={cn(interactive && "cursor-pointer transition-transform duration-100 hover:scale-110")}
        >
          <Star
            className={sizeClass}
            style={{
              color: star <= displayValue ? "#eaad00" : "#d1d5db",
              fill: star <= displayValue ? "#eaad00" : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  )
}
