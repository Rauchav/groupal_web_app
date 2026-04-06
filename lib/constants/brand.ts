export const BRAND_COLORS = {
  navy: "#002356",
  blue: "#1b4487",
  gold: "#eaad00",
  orange: "#e86300",
  green: "#048943",
  white: "#ffffff",
  gray: "#6B7A99",
  red: "#DA1200",
} as const

export const GROUPAL_FEES = {
  reservationPercent: 10,
  minPlatformFee: 0.5,
  maxPlatformFee: 3,
  defaultPlatformFee: 1.5,
} as const

export const DEAL_CONFIG = {
  maxGracePeriodDays: 3,
  maxPaymentRetries: 3,
  minBuyersRequired: 1,
  maxDealDurationDays: 30,
} as const

export const DISCOUNT_COLORS = {
  low: "#6B7A99",
  medium: "#eaad00",
  high: "#e86300",
  maximum: "#048943",
} as const

export const APP_NAME = "Groupal"
export const APP_TAGLINE = "Buy Together. Save Massive."
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
