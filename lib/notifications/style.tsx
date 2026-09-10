import {
  Bell, CheckCircle2, TrendingDown, TrendingUp, Clock, PartyPopper,
  CreditCard, AlertTriangle, BellRing, Rocket, Wallet,
} from "lucide-react"
import type { NotificationType } from "@/lib/types/payment"

// Per-type icon + accent color, shared by both the buyer
// (app/(buyers)/dashboard/notifications/page.tsx) and seller
// (app/sellers/dashboard/notifications/page.tsx) Notifications pages —
// every NotificationType a buyer OR a seller can receive lives in the same
// table here, since both pages render the identical NotificationRecord
// shape (lib/types/payment.ts) and just filter by whichever ones their
// paymentsDb.listNotificationsForUser(userId) call actually returns. Colors
// follow CLAUDE.md's semantics: green for success/confirm, navy/blue for
// progress, orange for urgency/reminders, red reserved for real
// warnings/errors.
export const NOTIFICATION_STYLE: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  DEAL_JOINED:            { icon: CheckCircle2,  color: "#048943", bg: "#048943" },
  DEAL_PROGRESS:          { icon: TrendingDown,   color: "#1b4487", bg: "#1b4487" },
  DEAL_ENDING_SOON:       { icon: Clock,          color: "#e86300", bg: "#e86300" },
  DEAL_COMPLETED:         { icon: PartyPopper,    color: "#048943", bg: "#048943" },
  PAYMENT_SUCCESS:        { icon: CreditCard,     color: "#048943", bg: "#048943" },
  PAYMENT_FAILED:         { icon: AlertTriangle,  color: "#DA1200", bg: "#DA1200" },
  PAYMENT_REMINDER:       { icon: BellRing,       color: "#e86300", bg: "#e86300" },
  RESERVATION_FORFEITED:  { icon: AlertTriangle,  color: "#DA1200", bg: "#DA1200" },
  SELLER_DEAL_PUBLISHED:  { icon: Rocket,         color: "#1b4487", bg: "#1b4487" },
  SELLER_NEW_BUYER:       { icon: TrendingUp,     color: "#1b4487", bg: "#1b4487" },
  SELLER_DEAL_COMPLETED:  { icon: PartyPopper,    color: "#048943", bg: "#048943" },
  SELLER_PAYOUT_SENT:     { icon: Wallet,         color: "#048943", bg: "#048943" },
  SELLER_PAYOUT_ISSUE:    { icon: AlertTriangle,  color: "#DA1200", bg: "#DA1200" },
}
