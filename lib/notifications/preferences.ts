// Buyer notification-preference shape — the single source of truth for
// User.notificationPreferences' keys and defaults. Shared between the
// buyer settings page (app/(buyers)/dashboard/settings/page.tsx, the UI
// that writes these) and lib/email/send.ts (which reads them server-side
// to decide whether a given notification type should also go out as an
// email). Keeping one definition means a new preference key can never
// drift out of sync between what the toggle writes and what the email
// sender checks.
export interface BuyerNotificationPreferences {
  emailNewBuyer: boolean
  emailEndingSoon: boolean
  emailDealCompleted: boolean
  emailPaymentReminders: boolean
  pushBuyerUpdates: boolean
  pushCountdownAlerts: boolean
  // Opt-in (default false, unlike the transactional toggles above) —
  // promotional emails about deals the buyer ISN'T necessarily already
  // in: new high-discount deals just published, and deals closing soon
  // that clear the same discount bar. See lib/email/constants.ts for the
  // discount threshold and lib/email/send.ts for the two trigger points.
  marketingEmails: boolean
}

export const DEFAULT_BUYER_NOTIFICATION_PREFERENCES: BuyerNotificationPreferences = {
  emailNewBuyer: true,
  emailEndingSoon: true,
  emailDealCompleted: true,
  emailPaymentReminders: true,
  pushBuyerUpdates: false,
  pushCountdownAlerts: false,
  marketingEmails: false,
}
