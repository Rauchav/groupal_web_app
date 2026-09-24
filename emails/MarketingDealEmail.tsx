import { Button, Heading, Img, Section, Text } from "@react-email/components"
import { EmailShell } from "./EmailShell"

// Promotional email — the two marketing triggers in lib/email/send.ts
// (new high-discount deal published, or an existing high-discount deal
// entering its final 24 hours) both render this. Only ever sent to buyers
// who opted in via BuyerNotificationPreferences.marketingEmails
// (lib/notifications/preferences.ts) — see that field's own comment.
export function MarketingDealEmail({
  eyebrow,
  productName,
  discountPercent,
  imageUrl,
  dealHref,
  appUrl,
}: {
  eyebrow: string
  productName: string
  discountPercent: number
  imageUrl?: string
  dealHref: string
  appUrl: string
}) {
  const pct = `${discountPercent.toFixed(0)}%`
  return (
    <EmailShell
      previewText={`${productName} — up to ${pct} off`}
      appUrl={appUrl}
      footerNote="You're receiving this because you opted into deal alerts on Groupal."
    >
      <Text style={{ color: "#e86300", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
        {eyebrow}
      </Text>

      {imageUrl && (
        <Section style={{ margin: "0 0 20px" }}>
          <Img src={imageUrl} width="416" height="220" alt={productName} style={{ borderRadius: 12, objectFit: "cover", width: "100%" }} />
        </Section>
      )}

      <Heading style={{ color: "#002356", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>{productName}</Heading>

      <Text style={{ display: "inline-block", backgroundColor: "#eaad00", color: "#002356", fontWeight: 800, fontSize: 13, padding: "4px 12px", borderRadius: 999, margin: "0 0 16px" }}>
        Up to {pct} off — buy together
      </Text>

      <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: "22px", margin: "0 0 24px" }}>
        The more buyers who join, the lower the price drops for everyone, including you. Reserve your spot with just
        10% down.
      </Text>

      <Button
        href={dealHref}
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
        View this deal
      </Button>
    </EmailShell>
  )
}

export default MarketingDealEmail
