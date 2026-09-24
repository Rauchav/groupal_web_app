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
