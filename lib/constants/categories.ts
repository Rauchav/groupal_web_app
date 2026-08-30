// Single source of truth for the marketplace category filter — used by the
// Navbar's category chips (which link into /deals?category=...) and by the
// /deals page itself, so the two stay in sync.
export const DEAL_CATEGORIES = [
  "All",
  "Electronics",
  "Cars & Motorcycles",
  "Computers",
  "Smartphones",
  "Furniture",
  "Travel",
  "Vacations",
] as const

export type DealCategory = (typeof DEAL_CATEGORIES)[number]
