import { Resend } from "resend"

let client: Resend | null | undefined

// Lazily constructed, and null (not thrown) when RESEND_API_KEY isn't set —
// every call site treats a null client as "skip sending" rather than a
// hard failure, same fail-soft reasoning the rest of this app's payment
// gateway mock already applies to external-service calls.
export function getResendClient(): Resend | null {
  if (client !== undefined) return client
  client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  return client
}

// Resend's own sandbox sender — works with zero domain verification, so
// email sending works out of the box in dev. Override with a verified
// "Groupal <notifications@yourdomain.com>" once a real sending domain is
// set up, via RESEND_FROM_EMAIL.
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || "Groupal <onboarding@resend.dev>"

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Static brand assets referenced FROM an email always resolve against the
// real production domain, never APP_URL directly — APP_URL is localhost
// in local dev, which no recipient's mail client can ever reach, so an
// email sent while testing locally would otherwise ship a permanently
// broken image link. The file itself (public/brand/) is already part of
// the deployed app, so this needs no separate upload/hosting step.
const PRODUCTION_URL = "https://groupal-web-app.vercel.app"
export const EMAIL_LOGO_URL = `${PRODUCTION_URL}/brand/logo%20fondo%20azul-email.png`
