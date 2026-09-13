import { MapPin, Flag, Globe2 } from "lucide-react"
import type { DealReach } from "@/lib/types/deal"
import { formatDealReach } from "@/lib/utils/deal-reach"
import { cn } from "@/lib/utils"

const SCOPE_ICON = { city: MapPin, country: Flag, continent: Globe2 } as const

// Shared "where this deal is available" indicator — same small icon+label
// treatment wherever deal info shows up for buyers or sellers (marketplace
// cards, checkout, seller deal lists/detail page). Lives at the
// component-tree root, like success-celebration.tsx, since it's genuinely
// portal-agnostic UI rather than buyer- or seller-specific. Renders nothing
// for a deal with no reach set yet (see formatDealReach) — callers don't
// need their own null check before rendering this.
export function DealReachBadge({
  reach,
  className,
  style,
}: {
  reach?: DealReach
  className?: string
  style?: React.CSSProperties
}) {
  const label = formatDealReach(reach)
  if (!reach || !label) return null
  const Icon = SCOPE_ICON[reach.scope]
  return (
    <span className={cn("inline-flex items-center gap-1 min-w-0", className)} style={style} title={reach.values.join(", ")}>
      <Icon className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  )
}
