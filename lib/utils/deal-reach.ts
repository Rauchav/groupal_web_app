import type { DealReach, DealReachScope } from "@/lib/types/deal"

// Turns a deal's reach into a short, comma-joined label for display
// wherever deal info shows up — cards, checkout, seller deal lists/detail
// (see components/deal-reach-badge.tsx, the one shared place that renders
// this). Returns null for a deal with no reach set yet (the seed catalog,
// or any deal created before this field existed) so every call site can
// just skip rendering rather than showing an empty/broken badge.
export function formatDealReach(reach?: DealReach): string | null {
  if (!reach || !reach.values?.length) return null
  const shown = reach.values.slice(0, 2)
  const remaining = reach.values.length - shown.length
  return remaining > 0 ? `${shown.join(", ")} +${remaining} more` : shown.join(", ")
}

export const REACH_SCOPE_LABEL: Record<DealReachScope, string> = {
  city: "City",
  country: "Country",
  continent: "Continent",
}
