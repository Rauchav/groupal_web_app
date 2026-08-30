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

export interface Deal {
  id:                   string
  sellerId:             string
  sellerName:           string
  sellerVerified:       boolean
  sellerUrl?:           string
  productName:          string
  productImage:         string
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
  status:               "active" | "completed" | "cancelled"
  createdAt:            Date
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
