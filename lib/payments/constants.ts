// Grace-period and scheduling rules for the two-charge payment flow.
// See "CRITICAL PAYMENT LOGIC" in CLAUDE.md for the full spec these encode.

export const DEFAULT_GRACE_PERIOD_DAYS = 3
export const HIGH_TICKET_GRACE_PERIOD_DAYS = 5
export const HIGH_TICKET_PRICE_THRESHOLD = 1500 // originalPrice at/above which the longer grace period applies

// Days into the grace period at which we auto-retry the final charge.
export const GRACE_PERIOD_RETRY_OFFSETS_DAYS = [1, 2] as const

// The card health-check job runs once a deal's deadline is this many days out.
export const HEALTH_CHECK_WINDOW_DAYS = { min: 4, max: 5 } as const

export function getGracePeriodDays(originalPrice: number): number {
  return originalPrice >= HIGH_TICKET_PRICE_THRESHOLD
    ? HIGH_TICKET_GRACE_PERIOD_DAYS
    : DEFAULT_GRACE_PERIOD_DAYS
}
