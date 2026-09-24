import { DEAL_CATEGORIES, type DealCategory } from "@/lib/constants/categories"

// Per-category guardrails for deal creation — see CLAUDE.md's "Category
// system & deal-creation guardrails" section for the two-tier validation
// pattern this powers (hard limits below are enforced, blocking; the
// recommended minimum is advisory only, never blocking). These specific
// numbers are a first pass and are EXPECTED to change once real market
// data comes in — this file, and this file alone, is where that update
// happens. Every consumer (the create-deal form's client-side Zod schema,
// POST /api/deals's server-side validation, the discount field's soft-
// guidance tooltip) reads through this table rather than hardcoding any
// of these numbers itself, so a future retune never touches more than
// this one file.
export interface CategoryRule {
  minDiscountPercent: number
  maxDiscountPercent: number
  // Advisory only — never blocks publishing. See the discount field's
  // soft-guidance tooltip in app/sellers/dashboard/deals/new/page.tsx.
  recommendedMinDiscountPercent: number
  minDurationDays: number
  maxDurationDays: number
  minBuyersRequired: number
  maxBuyersRequired: number
}

export const CATEGORY_RULES: Record<Exclude<DealCategory, "All">, CategoryRule> = {
  Electronics: { minDiscountPercent: 5,  maxDiscountPercent: 40, recommendedMinDiscountPercent: 15, minDurationDays: 3, maxDurationDays: 21, minBuyersRequired: 10, maxBuyersRequired: 50 },
  Motors:      { minDiscountPercent: 5,  maxDiscountPercent: 25, recommendedMinDiscountPercent: 12, minDurationDays: 3, maxDurationDays: 30, minBuyersRequired: 5,  maxBuyersRequired: 20 },
  Computers:   { minDiscountPercent: 5,  maxDiscountPercent: 35, recommendedMinDiscountPercent: 15, minDurationDays: 3, maxDurationDays: 30, minBuyersRequired: 5,  maxBuyersRequired: 20 },
  Smartphones: { minDiscountPercent: 5,  maxDiscountPercent: 30, recommendedMinDiscountPercent: 12, minDurationDays: 3, maxDurationDays: 21, minBuyersRequired: 5,  maxBuyersRequired: 20 },
  Home:        { minDiscountPercent: 10, maxDiscountPercent: 55, recommendedMinDiscountPercent: 20, minDurationDays: 3, maxDurationDays: 14, minBuyersRequired: 10, maxBuyersRequired: 50 },
  Health:      { minDiscountPercent: 10, maxDiscountPercent: 60, recommendedMinDiscountPercent: 20, minDurationDays: 3, maxDurationDays: 21, minBuyersRequired: 10, maxBuyersRequired: 20 },
  Fashion:     { minDiscountPercent: 15, maxDiscountPercent: 65, recommendedMinDiscountPercent: 25, minDurationDays: 3, maxDurationDays: 14, minBuyersRequired: 10, maxBuyersRequired: 50 },
  Leisure:     { minDiscountPercent: 15, maxDiscountPercent: 35, recommendedMinDiscountPercent: 20, minDurationDays: 3, maxDurationDays: 21, minBuyersRequired: 10, maxBuyersRequired: 50 },
  Sports:      { minDiscountPercent: 10, maxDiscountPercent: 45, recommendedMinDiscountPercent: 18, minDurationDays: 3, maxDurationDays: 14, minBuyersRequired: 10, maxBuyersRequired: 50 },
  Travels:     { minDiscountPercent: 5,  maxDiscountPercent: 15, recommendedMinDiscountPercent: 8,  minDurationDays: 3, maxDurationDays: 21, minBuyersRequired: 10, maxBuyersRequired: 50 },
}

export function getCategoryRule(category: string): CategoryRule | undefined {
  return (CATEGORY_RULES as Record<string, CategoryRule>)[category]
}

// Every real category (everything but "All") must have a rule — a missing
// entry would silently let the hard-limit validation below no-op for
// whichever category was forgotten. Checked once at module load, not per
// call, since DEAL_CATEGORIES only ever changes at build time.
const missing = DEAL_CATEGORIES.filter((c) => c !== "All" && !CATEGORY_RULES[c as Exclude<DealCategory, "All">])
if (missing.length > 0) {
  throw new Error(`category-rules.ts is missing a CategoryRule for: ${missing.join(", ")}`)
}
