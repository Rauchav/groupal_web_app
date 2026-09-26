export interface DiscountMilestone {
  buyerCount:      number   // e.g. 10, 20, 40
  discountPercent: number   // e.g. 12.5, 25, 50
  label:           string   // e.g. "Getting started", "Halfway", "Max deal"
}

// Set by the seller when uploading the product / creating the deal.
// Required whenever isPickup is true.
export interface PickupDetails {
  location:          string   // address / place name where the item is picked up
  hours:              string   // e.g. "Mon–Sat, 9:00 AM – 6:00 PM"
  instructions:       string   // free-text explanation of how the pickup process works
  codeRequired:       string   // what code the buyer must present (e.g. order confirmation code)
  documentsRequired:  string   // what documents the buyer must present (e.g. valid photo ID)
  contactName:        string
  contactPhone:       string
  contactEmail:       string
}

// A flat-rate pricing option a buyer picks at checkout when a deal isn't
// pickup-only (e.g. "Downtown" $10, "Suburbs" $20). Manual for now — see
// Deal.deliveryZones below.
export interface DeliveryZone {
  label: string   // e.g. "Downtown"
  price: number   // e.g. 10
}

export interface Deal {
  id:                   string
  sellerId:             string
  // The seller's real Clerk user id — distinct from sellerId above, which
  // is the internal seller-profile id (sellers/stores/seller-store.ts
  // generates "seller_..." ids, not Clerk ids). Notifications must be
  // targeted by Clerk id, since that's what paymentsDb.listNotificationsForUser()
  // and the signed-in useUser().id the notifications pages read from both
  // key off — sellerId alone can't be used for that. Seed deals
  // (lib/mock/deals.ts) set this to the same placeholder as sellerId
  // ("seller-00X") — there's no real Clerk account behind those, so any
  // notification sent there is a harmless no-op nobody ever sees.
  sellerUserId:         string
  sellerName:           string
  sellerVerified:       boolean
  sellerUrl?:           string
  productName:          string
  // Free-text detail beyond the name — nights/hotel/inclusions for a
  // vacation package, specs for electronics, etc. Optional: older deals
  // and the seed catalog predate this field. Never shown on the compact
  // marketplace deal cards (no room); shown at checkout, the seller's
  // deal-detail page, and the buyer dashboard's open-deal cards, always
  // right below the product title.
  productDescription?:  string
  productImages:        string[]  // 1–6 URLs; the first is the cover/main image
  category:             string
  originalPrice:        number
  currency?:            string
  maxDiscountPercent:   number   // e.g. 50 (meaning 50%)
  maxBuyersRequired:    number   // e.g. 40
  currentBuyerCount:    number   // e.g. 14
  deadlineAt:           Date
  milestones:           DiscountMilestone[]
  reservationFeePercent: number  // always 10
  isPickup:             boolean          // seller-defined at deal creation: true = pick up in store, false = delivered
  pickupDetails?:       PickupDetails    // required when isPickup is true
  // 1–4 flat-rate options a buyer picks from at checkout; required when
  // isPickup is false. Optional on the type (not every deal — namely the
  // seed catalog — has been given zones yet) so every read site falls
  // back to a flat rate rather than assuming this is always populated.
  deliveryZones?:       DeliveryZone[]
  status:               "active" | "completed" | "cancelled"
  createdAt:            Date
  // Set true the first time the "ending soon" (<24h left) notification
  // sweep fires for this deal — see lib/jobs/deal-ending-soon-job.ts.
  // Mutated directly on the Deal object, same as status/currentBuyerCount
  // already are, so the mock sweep (re-run on every relevant page load,
  // no real cron yet) doesn't re-notify buyers every time it runs.
  endingSoonNotified?:  boolean
  // Where this deal is available to buyers — one or more cities, one or
  // more countries, OR one or more continents (never a mix of scopes).
  // Captured at creation (app/sellers/dashboard/deals/new/page.tsx) via a
  // scope choice + a multi-value picker for that scope, and shown
  // everywhere deal info shows up (see components/deal-reach-badge.tsx).
  // Required going forward in that form, but optional on the type itself —
  // same reasoning as deliveryZones above: the seed catalog
  // (lib/mock/deals.ts) and any deal created before this field existed
  // don't have it, so every read site needs a fallback (see
  // lib/utils/deal-reach.ts's formatDealReach, which returns null for that
  // case) rather than assuming it's always populated. Supersedes an
  // earlier, narrower city/country pair this same field replaced. Not
  // wired into any actual buyer-side filtering/matching yet — informational
  // only until the region-matching rules themselves are defined.
  reach?:               DealReach
  // Deep link to this exact product's listing on the seller's own website
  // or marketplace, so a buyer can go look at the original page (reviews,
  // full specs, etc.) alongside the group deal. Optional while this is new
  // — a later pass will make it required at creation, same maturity path
  // deliveryZones/productImages already went through.
  externalProductUrl?:  string
}

export type DealReachScope = "city" | "country" | "continent"

export interface DealReach {
  scope:  DealReachScope
  // One or more names matching `scope` — city names, country names, or a
  // subset of lib/constants/continents.ts's fixed CONTINENTS list. Never a
  // mix of scopes on the same deal.
  values: string[]
}

export interface DealComputedValues {
  discountPerBuyer:       number   // maxDiscountPercent / maxBuyersRequired
  currentDiscountPercent: number   // currentBuyerCount × discountPerBuyer
  currentPrice:           number   // originalPrice × (1 - currentDiscount)
  savingsAmount:          number   // originalPrice - currentPrice
  progressPercent:        number   // currentBuyerCount / maxBuyersRequired × 100
  reservationAmount:      number   // originalPrice × 0.10 — fixed, based on store price — the ONLY amount buyers pay at checkout
  sellerPlatformFeeAmount: number  // originalPrice × platformFeePercent — SELLER-SIDE ONLY, deducted from the seller's payout at deal close, never charged to or shown to buyers
  remainingAmount:        number   // originalPrice - reservationAmount = 90% of store price
}
