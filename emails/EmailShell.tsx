import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components"
import { EMAIL_LOGO_URL } from "@/lib/email/resend"

// Shared branded wrapper for every Groupal email — the navy header, white
// card, and preferences-link footer are identical across the transactional
// (NotificationEmail.tsx) and promotional (MarketingDealEmail.tsx)
// templates; only the content slot between them differs. Brand colors/
// fonts match CLAUDE.md's Brand Identity section.
export function EmailShell({
  previewText,
  appUrl,
  footerNote,
  children,
}: {
  previewText: string
  appUrl: string
  footerNote?: string
  children: React.ReactNode
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={EMAIL_LOGO_URL} width="136" height="34" alt="Groupal" style={styles.logo} />
          </Section>

          <Section style={styles.content}>{children}</Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              {footerNote ?? "You're receiving this because you have an account on Groupal."}{" "}
              <Link href={`${appUrl}/dashboard/settings`} style={styles.footerLink}>
                Manage email preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#f0f2f5",
    fontFamily: "'Inter', Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "32px 16px",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    maxWidth: 480,
    margin: "0 auto",
  },
  header: {
    backgroundColor: "#002356",
    padding: "22px 32px",
  },
  logo: {
    display: "block",
    margin: 0,
  },
  content: {
    padding: "32px",
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: 0,
  },
  footer: {
    padding: "18px 32px 24px",
  },
  footerText: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: "18px",
    margin: 0,
  },
  footerLink: {
    color: "#1b4487",
    textDecoration: "underline",
  },
}
