// Single source of truth for the marketplace category filter — used by the
// Navbar's category chips (which link into /deals?category=...), the /deals
// page itself, the seller create-deal form, and seller onboarding's primary
// category picker, so all of them stay in sync. Finalized 2026-09-19 — see
// CLAUDE.md's "Category system & deal-creation guardrails" section for the
// per-category rules (lib/constants/category-rules.ts) this list feeds.
export const DEAL_CATEGORIES = [
  "All",
  "Electronics",
  "Motors",
  "Computers",
  "Smartphones",
  "Home",
  "Health",
  "Fashion",
  "Leisure",
  "Sports",
  "Travels",
] as const

export type DealCategory = (typeof DEAL_CATEGORIES)[number]
