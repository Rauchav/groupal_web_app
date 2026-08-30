import { nanoid } from "nanoid"

// Mock Stripe-style off-session-capable gateway. Swap this whole module for
// real Stripe calls once Connect is configured (~May 2026, see CLAUDE.md):
//   - saveMockPaymentMethod   → Stripe SetupIntent / PaymentMethod attach
//   - chargeOffSession        → PaymentIntent.create({ off_session: true, confirm: true, payment_method })
//   - checkPaymentMethodValidity → PaymentMethod retrieve + a $0 SetupIntent confirm
// Callers in lib/payments/ and lib/jobs/ depend only on these three
// functions' signatures, not on any mock internals.

export interface MockPaymentMethod {
  ref:   string // stand-in for a Stripe PaymentMethod id (pm_xxx) — reusable for the later off-session charge
  brand: string
  last4: string
}

export interface ChargeResult {
  success:        boolean
  stripeId?:      string
  failureReason?: string
}

export interface ValidityResult {
  valid:   boolean
  reason?: string
}

// Lets tests/demos force a deterministic outcome instead of the random
// simulation below.
export type ForcedOutcome = "success" | "failure"

const FAILURE_REASONS = ["card_declined", "insufficient_funds", "expired_card", "card_not_supported"]

export function saveMockPaymentMethod(): MockPaymentMethod {
  return { ref: `pm_mock_${nanoid(12)}`, brand: "visa", last4: "4242" }
}

export async function chargeOffSession(
  paymentMethodRef: string,
  amount: number,
  forceOutcome?: ForcedOutcome,
): Promise<ChargeResult> {
  await delay(300)
  const success = forceOutcome ? forceOutcome === "success" : Math.random() < 0.9
  if (!success) {
    return { success: false, failureReason: pickFailureReason() }
  }
  return { success: true, stripeId: `ch_mock_${nanoid(14)}` }
}

export async function checkPaymentMethodValidity(
  paymentMethodRef: string,
  forceOutcome?: ForcedOutcome,
): Promise<ValidityResult> {
  await delay(150)
  const valid = forceOutcome ? forceOutcome === "success" : Math.random() < 0.95
  return valid ? { valid: true } : { valid: false, reason: pickFailureReason() }
}

function pickFailureReason(): string {
  return FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)]
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
