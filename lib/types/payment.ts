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
  | "SELLER_NEW_BUYER"
  | "SELLER_DEAL_COMPLETED"
  | "SELLER_PAYOUT_SENT"

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
