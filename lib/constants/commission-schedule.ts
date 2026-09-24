// Groupal's seller-side commission — see CLAUDE.md's "Category system &
// deal-creation guardrails" section. Replaces the old flat
// SELLER_PLATFORM_FEE_PERCENT constant in lib/utils/deal-calculator.ts: a
// higher store price now earns a LOWER commission percentage, tapering
// smoothly (log-linearly — a straight-line decline per order of
// magnitude, not per dollar) within each price bracket below, and
// continuous across every bracket boundary (each bracket's endPercent
// equals the next bracket's startPercent exactly, on purpose — this is
// what keeps the curve smooth instead of stepping). These specific
// numbers are a first pass and are EXPECTED to change after real market
// research — this file, and only this file, is where that happens; every
// consumer calls getCommissionPercentForPrice() rather than reading these
// brackets directly.
export interface CommissionBracket {
  minPrice: number
  maxPrice: number
  startPercent: number
  endPercent: number
}

export const COMMISSION_SCHEDULE: CommissionBracket[] = [
  { minPrice: 1,       maxPrice: 100,     startPercent: 12,  endPercent: 8   },
  { minPrice: 100,     maxPrice: 1000,    startPercent: 8,   endPercent: 5   },
  { minPrice: 1000,    maxPrice: 10000,   startPercent: 5,   endPercent: 3   },
  { minPrice: 10000,   maxPrice: 100000,  startPercent: 3,   endPercent: 1.5 },
  { minPrice: 100000,  maxPrice: 500000,  startPercent: 1.5, endPercent: 0.5 },
]

// Log-linear interpolation within the matched bracket: percent moves in a
// straight line against log(price), not against price itself, so the
// decline reads as "smooth per order of magnitude" rather than
// front-loaded at the low end of a bracket. Prices outside the whole
// schedule clamp to the nearest end (below $1 → the first bracket's
// startPercent, above $500,000 → the last bracket's endPercent) rather
// than extrapolating or throwing.
export function getCommissionPercentForPrice(price: number): number {
  const first = COMMISSION_SCHEDULE[0]
  const last = COMMISSION_SCHEDULE[COMMISSION_SCHEDULE.length - 1]
  if (price <= first.minPrice) return first.startPercent
  if (price >= last.maxPrice) return last.endPercent

  const bracket = COMMISSION_SCHEDULE.find((b) => price >= b.minPrice && price <= b.maxPrice) ?? last
  const t = (Math.log(price) - Math.log(bracket.minPrice)) / (Math.log(bracket.maxPrice) - Math.log(bracket.minPrice))
  return bracket.startPercent + t * (bracket.endPercent - bracket.startPercent)
}
