import { Button, Heading, Text } from "@react-email/components"
import { EmailShell } from "./EmailShell"

// Generic transactional email — the email mirror of EVERY in-app
// notification (lib/notifications/copy.ts already produces a title+message
// pair for each NotificationType; this component just renders whichever
// one triggered it). One template for all 13 types rather than 13 near-
// identical ones, same "don't over-engineer" reasoning as copy.ts itself
// being one file. Sent by lib/notifications/create-notification.ts.
export function NotificationEmail({
  title,
  message,
  ctaLabel,
  ctaHref,
  appUrl,
}: {
  title: string
  message: string
  ctaLabel: string
  ctaHref: string
  appUrl: string
}) {
  return (
    <EmailShell previewText={title} appUrl={appUrl}>
      <Heading style={{ color: "#002356", fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>{title}</Heading>
      <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: "22px", margin: "0 0 24px" }}>{message}</Text>
      <Button
        href={ctaHref}
        style={{
          backgroundColor: "#048943",
          color: "#ffffff",
          padding: "12px 28px",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        {ctaLabel}
      </Button>
    </EmailShell>
  )
}

export default NotificationEmail
