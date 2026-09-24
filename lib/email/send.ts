import { prisma } from "@/lib/db"
import { getResendClient, EMAIL_FROM, APP_URL } from "@/lib/email/resend"
import { NotificationEmail } from "@/emails/NotificationEmail"
import { MarketingDealEmail } from "@/emails/MarketingDealEmail"
import { MARKETING_DISCOUNT_THRESHOLD_PERCENT } from "@/lib/email/constants"
import { DEFAULT_BUYER_NOTIFICATION_PREFERENCES, type BuyerNotificationPreferences } from "@/lib/notifications/preferences"
import type { NotificationType } from "@/lib/types/payment"

// Which buyer preference key (lib/notifications/preferences.ts) gates each
// NotificationType's email. A type with no entry here is NOT gated by any
// toggle — always emailed. That's deliberate for: DEAL_JOINED and
// PAYMENT_SUCCESS (receipt-style confirmations of an action the buyer
// themselves just took — the same reasoning a store always emails your
// order confirmation even if you opted out of shipping-update emails),
// RESERVATION_FORFEITED (the one and only way a buyer loses their
// reservation — too important to silence), and every SELLER_* type
// (sellers have no granular email toggle yet, only the buyer settings page
// does — see app/(buyers)/dashboard/settings/page.tsx's NotificationsTab).
const PREFERENCE_KEY_BY_TYPE: Partial<Record<NotificationType, keyof BuyerNotificationPreferences>> = {
  DEAL_PROGRESS: "emailNewBuyer",
  DEAL_ENDING_SOON: "emailEndingSoon",
  DEAL_COMPLETED: "emailDealCompleted",
  PAYMENT_FAILED: "emailPaymentReminders",
  PAYMENT_REMINDER: "emailPaymentReminders",
}

function ctaFor(type: NotificationType, data: Record<string, unknown> | null | undefined) {
  const dealId = (data as { dealId?: string } | undefined)?.dealId
  if (type.startsWith("SELLER_")) {
    return {
      href: dealId ? `${APP_URL}/sellers/dashboard/deals/${dealId}` : `${APP_URL}/sellers/dashboard`,
      label: "View in seller dashboard",
    }
  }
  return {
    href: dealId ? `${APP_URL}/checkout/${dealId}` : `${APP_URL}/dashboard`,
    label: "View in Groupal",
  }
}

// Called by lib/notifications/create-notification.ts right after every
// in-app Notification row is written — this is the one place that decides
// whether a given notification also goes out as an email, and to check the
// recipient's own preference before sending. Never throws: a Resend hiccup
// must never fail the underlying action (joining a deal, closing a deal,
// etc.) that triggered the notification in the first place.
export async function sendNotificationEmail({
  userId,
  type,
  title,
  message,
  data,
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown> | null
}): Promise<void> {
  const resend = getResendClient()
  if (!resend) return

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, notificationPreferences: true } })
    if (!user?.email) return

    const prefKey = PREFERENCE_KEY_BY_TYPE[type]
    if (prefKey) {
      const prefs = (user.notificationPreferences as Partial<BuyerNotificationPreferences> | null) ?? {}
      const enabled = prefs[prefKey] ?? DEFAULT_BUYER_NOTIFICATION_PREFERENCES[prefKey]
      if (!enabled) return
    }

    const { href, label } = ctaFor(type, data)
    await resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: title,
      react: NotificationEmail({ title, message, ctaLabel: label, ctaHref: href, appUrl: APP_URL }),
    })
  } catch (err) {
    console.error("[email] failed to send notification email", { userId, type, err })
  }
}

// Marketing trigger 1 — a seller just published a deal whose max discount
// clears MARKETING_DISCOUNT_THRESHOLD_PERCENT. Called from POST
// /api/deals right after the deal row is created.
export async function sendNewDealMarketingEmails(deal: {
  id: string
  productName: string
  productImages: string[]
  maxDiscountPercent: number
}): Promise<void> {
  if (deal.maxDiscountPercent < MARKETING_DISCOUNT_THRESHOLD_PERCENT) return
  await broadcastMarketingEmail({
    deal,
    eyebrow: "New deal just launched",
    discountPercent: deal.maxDiscountPercent,
    excludeUserIds: [],
  })
}

// Marketing trigger 2 — an ACTIVE deal is entering its final 24 hours and
// its CURRENT discount clears the threshold. Called from the sweep job
// (POST /api/jobs/sweep), guarded there by Deal.marketingEndingSoonSent so
// it only ever fires once per deal. Buyers already participating in the
// deal are excluded — they already got the transactional "ending soon"
// email (lib/notifications/copy.ts's dealEndingSoonCopy), this is only for
// buyers who might still want to join.
export async function sendEndingSoonMarketingEmails(
  deal: { id: string; productName: string; productImages: string[] },
  currentDiscountPercent: number,
  excludeUserIds: string[]
): Promise<void> {
  if (currentDiscountPercent < MARKETING_DISCOUNT_THRESHOLD_PERCENT) return
  await broadcastMarketingEmail({
    deal,
    eyebrow: "Closing soon — don't miss it",
    discountPercent: currentDiscountPercent,
    excludeUserIds,
  })
}

async function broadcastMarketingEmail({
  deal,
  eyebrow,
  discountPercent,
  excludeUserIds,
}: {
  deal: { id: string; productName: string; productImages: string[] }
  eyebrow: string
  discountPercent: number
  excludeUserIds: string[]
}): Promise<void> {
  const resend = getResendClient()
  if (!resend) return

  try {
    const recipients = await prisma.user.findMany({
      where: {
        role: "BUYER",
        id: { notIn: excludeUserIds },
        notificationPreferences: { path: ["marketingEmails"], equals: true },
      },
      select: { email: true },
    })
    if (recipients.length === 0) return

    const dealHref = `${APP_URL}/checkout/${deal.id}`
    const results = await Promise.allSettled(
      recipients.map((r) =>
        resend.emails.send({
          from: EMAIL_FROM,
          to: r.email,
          subject: `${eyebrow}: ${deal.productName}`,
          react: MarketingDealEmail({
            eyebrow,
            productName: deal.productName,
            discountPercent,
            imageUrl: deal.productImages[0],
            dealHref,
            appUrl: APP_URL,
          }),
        })
      )
    )
    const failures = results.filter((r) => r.status === "rejected").length
    if (failures > 0) console.error(`[email] ${failures}/${recipients.length} marketing emails failed for deal ${deal.id}`)
  } catch (err) {
    console.error("[email] failed to broadcast marketing emails", { dealId: deal.id, err })
  }
}
