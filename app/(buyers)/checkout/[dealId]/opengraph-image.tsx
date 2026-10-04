import { ImageResponse } from "next/og"
import { prisma } from "@/lib/db"
import { dealInclude, dealRowToApiDeal } from "@/lib/api/deal-include"
import { apiDealToDeal } from "@/lib/api/deal-adapter"
import { computeDealValues } from "@/lib/utils/deal-calculator"

// Layout/colors match the reference mockup at public/references/
// "groupal deal share image.png" (#1b4487 panel background, no red max-
// discount tag on the product photo, outlined — not filled — stat boxes,
// no wordmark above the title). Was "edge" — switched to the default
// Node.js runtime because fetching the real deal needs the shared Prisma
// client (lib/db.ts), whose @prisma/adapter-pg driver relies on Node's
// net/tls modules and doesn't run on the Edge runtime. next/og's
// ImageResponse works the same either way; edge was never load-bearing
// for this route, just next/og's original default.
export const alt = "Groupal group buy deal"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function Image({ params }: { params: { dealId: string } }) {
  const dealRow = await prisma.deal.findUnique({ where: { id: params.dealId }, include: dealInclude })
  const deal = dealRow ? apiDealToDeal(dealRowToApiDeal(dealRow)) : null

  if (!deal) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1b4487",
            fontSize: 48,
            fontWeight: 800,
            color: "#ffffff",
          }}
        >
          Groupal
        </div>
      ),
      { ...size }
    )
  }

  const computed = computeDealValues(deal)
  const deadline = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(deal.deadlineAt)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          fontFamily: "sans-serif",
        }}
      >
        {/* Product image — left */}
        <div style={{ width: 530, height: "100%", display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={deal.productImages[0]}
            alt=""
            width={530}
            height={630}
            style={{ objectFit: "cover", width: 530, height: 630 }}
          />
        </div>

        {/* Info panel — right */}
        <div
          style={{
            width: 670,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            backgroundColor: "#1b4487",
            padding: "40px 48px",
            gap: 20,
          }}
        >
          {/* Product title — minHeight reserves room for 2 wrapped lines
              so a long name never overlaps the price block below it;
              Satori's flex layout doesn't always re-measure a sibling gap
              against text that wraps to more lines than its single-line
              estimate. */}
          <div
            style={{
              display: "flex",
              fontSize: 42,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.15,
              minHeight: 100,
            }}
          >
            {deal.productName.length > 58 ? deal.productName.slice(0, 55) + "…" : deal.productName}
          </div>

          {/* Prices */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, color: "#9fb0d0" }}>
                IN-STORE PRICE
              </span>
              <span style={{ fontSize: 44, fontWeight: 700, color: "#9fb0d0", textDecoration: "line-through" }}>
                {fmt(deal.originalPrice, deal.currency)}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Satori collapses whitespace-only text nodes between flex-
                  item spans no matter how the space is authored (plain
                  text, trailing-in-span, {" "} expression) — flex `gap` on
                  the row is the only reliable way to separate colored
                  segments. "Grou"/"pal" need to stay glued (one word), so
                  they're nested in their own zero-gap sub-row. */}
              <div style={{ display: "flex", fontSize: 30, fontWeight: 800, gap: 8 }}>
                <div style={{ display: "flex" }}>
                  <span style={{ color: "#ffffff" }}>Grou</span>
                  <span style={{ color: "#eaad00" }}>pal</span>
                </div>
                <span style={{ color: "#ffffff" }}>price now</span>
              </div>
              <span style={{ fontSize: 58, fontWeight: 800, color: "#ffffff" }}>
                {fmt(computed.currentPrice, deal.currency)}
              </span>
            </div>
          </div>

          {/* Discount boxes — outlined, not filled */}
          <div style={{ display: "flex", gap: 18 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "3px solid #ffffff",
                borderRadius: 18,
                padding: "12px 26px",
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>Right now</span>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#ffffff" }}>
                {computed.currentDiscountPercent.toFixed(2)}%
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "3px solid #eaad00",
                borderRadius: 18,
                padding: "12px 26px",
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>If group fills up</span>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#eaad00" }}>
                {deal.maxDiscountPercent}%
              </span>
            </div>
          </div>

          {/* Buyers + deadline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, gap: 8 }}>
              <span style={{ color: "#eaad00" }}>{deal.currentBuyerCount}</span>
              <span style={{ color: "#ffffff" }}>of</span>
              <span style={{ color: "#eaad00" }}>{deal.maxBuyersRequired}</span>
              <span style={{ color: "#ffffff" }}>buyers joined</span>
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#e86300" }}>
              Ends {deadline}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
