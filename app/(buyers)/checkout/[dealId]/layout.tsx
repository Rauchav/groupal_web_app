import type { Metadata } from "next"
import { getMockDealById } from "@/lib/mock/deals"
import { computeDealValues } from "@/lib/utils/deal-calculator"

// The checkout page itself is a client component ("use client" — it needs
// hooks/state for the 3-step form), so it can't export generateMetadata.
// This server layout wraps it purely to supply per-deal link-preview
// metadata (title/description/OG/Twitter card) for when a buyer shares a
// /checkout/[dealId] link on WhatsApp, iMessage, etc. The actual preview
// image comes from the sibling opengraph-image.tsx, which Next.js wires in
// automatically for this route segment.
export async function generateMetadata({
  params,
}: {
  params: { dealId: string }
}): Promise<Metadata> {
  const deal = getMockDealById(params.dealId)
  if (!deal) {
    return { title: "Deal not found — Groupal" }
  }

  const computed = computeDealValues(deal)
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: deal.currency ?? "USD", maximumFractionDigits: 0 }).format(n)
  const deadline = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(deal.deadlineAt)

  const title = `${deal.productName} — ${fmt(computed.currentPrice)} on Groupal (${computed.currentDiscountPercent.toFixed(0)}% off)`
  const description =
    `Store price ${fmt(deal.originalPrice)} → Groupal price ${fmt(computed.currentPrice)} right now ` +
    `(${computed.currentDiscountPercent.toFixed(1)}% off, up to ${deal.maxDiscountPercent}% off if the group fills up). ` +
    `Deal ends ${deadline} — join and drop the price for everyone!`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Groupal",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default function CheckoutDealLayout({ children }: { children: React.ReactNode }) {
  return children
}
