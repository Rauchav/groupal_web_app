// Mirrors the Prisma models (GroupBuyParticipation, Payment, Notification)
// and enums field-for-field. Used by the mock payment engine in
// lib/mock/payments-db.ts, lib/payments/, and lib/jobs/ so those modules
// can be pointed at a real Prisma client later with minimal changes.

export type PaymentStatus =
  | "RESERVATION_PAID"
  | "AWAITING_FINAL_PAYMENT"
  | "FINAL_PAYMENT_PAID"
  | "PAYMENT_FAILED"
  | "IN_GRACE_PERIOD"
  | "FORFEITED"
  | "REFUNDED"

export type PaymentType = "RESERVATION" | "FINAL_PAYMENT" | "REFUND" | "PAYOUT"

export type NotificationType =
  | "DEAL_JOINED"
  | "DEAL_PROGRESS"
  | "DEAL_ENDING_SOON"
  | "DEAL_COMPLETED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "PAYMENT_REMINDER"
  | "RESERVATION_FORFEITED"
  | "SELLER_DEAL_PUBLISHED"
  | "SELLER_NEW_BUYER"
  | "SELLER_DEAL_COMPLETED"
  | "SELLER_PAYOUT_SENT"
  | "SELLER_PAYOUT_ISSUE"

export interface DeliveryAddressSnapshot {
  street:   string
  city:     string
  state:    string
  country:  string
  zipCode?: string
}

export interface Participation {
  id:                    string
  dealId:                string
  buyerId:               string
  // Captured from Clerk at the moment the buyer checks out (there's no
  // backend users table this mock layer can look other buyers' profiles
  // up in later — Clerk's client SDK only ever exposes the CURRENTLY
  // signed-in user). Denormalized onto the participation itself so the
  // seller's deal-detail page (app/sellers/dashboard/deals/[id]/page.tsx)
  // can show who's actually in the group. Optional only so participations
  // created before this field existed still parse.
  buyerName?:            string
  buyerAvatarUrl?:       string
  reservationAmount:     number
  platformFee:           number   // seller-side fee snapshot, used for payout calc at deal close — never shown to the buyer
  deliveryCost:          number
  status:                PaymentStatus
  paymentMethodRef:      string   // mock Stripe PaymentMethod id, saved at reservation time and reused off-session for the final charge
  stripePaymentIntentId?: string
  finalDiscountPercent?: number
  finalPrice?:           number
  deliveryAddress?:      DeliveryAddressSnapshot
  gracePeriodDays?:      number   // snapshotted when a charge first fails, so a later constant change doesn't alter an in-flight grace period
  graceDeadline?:        Date
  retryAttempts:         number
  createdAt:             Date
  updatedAt:             Date
}

export interface PaymentRecord {
  id:              string
  participationId: string
  amount:          number
  type:            PaymentType
  status:          PaymentStatus
  stripeId?:       string
  failureReason?:  string
  createdAt:       Date
}

export interface NotificationRecord {
  id:        string
  userId:    string
  type:      NotificationType
  title:     string
  message:   string
  read:      boolean
  data?:     Record<string, unknown>
  createdAt: Date
}
