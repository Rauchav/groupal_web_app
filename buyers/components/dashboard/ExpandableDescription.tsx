"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// Clamps a deal description to 2 lines and only shows a "Read more" toggle
// when the text actually overflows that clamp — a short description never
// gets a pointless toggle that expands to the exact same thing.
export function ExpandableDescription({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1)
  }, [text])

  return (
    <div>
      <p ref={ref} className={cn(className, !expanded && "line-clamp-2")}>
        {text}
      </p>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs font-bold text-[#1b4487] hover:underline cursor-pointer mt-0.5"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  )
}
