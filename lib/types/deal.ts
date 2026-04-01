export interface DiscountMilestone {
  buyerCount:      number   // e.g. 10, 20, 40
  discountPercent: number   // e.g. 12.5, 25, 50
  label:           string   // e.g. "Getting started", "Halfway", "Max deal"
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
  status:               "active" | "completed" | "cancelled"
  createdAt:            Date
}

export interface DealComputedValues {
  discountPerBuyer:       number   // maxDiscountPercent / maxBuyersRequired
  currentDiscountPercent: number   // currentBuyerCount × discountPerBuyer
  currentPrice:           number   // originalPrice × (1 - currentDiscount)
  savingsAmount:          number   // originalPrice - currentPrice
  progressPercent:        number   // currentBuyerCount / maxBuyersRequired × 100
  reservationAmount:      number   // currentPrice × 0.10
  remainingAmount:        number   // currentPrice × 0.90
}
