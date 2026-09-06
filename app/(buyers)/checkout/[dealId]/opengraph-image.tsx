import { ImageResponse } from "next/og"
import { getMockDealById } from "@/lib/mock/deals"
import { computeDealValues, getDiscountColor } from "@/lib/utils/deal-calculator"

export const runtime = "edge"
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
  const deal = getMockDealById(params.dealId)

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
            backgroundColor: "#002356",
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
  const zoneColor = getDiscountColor(computed.progressPercent)
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
        {/* Product image — left half */}
        <div style={{ width: 500, height: "100%", display: "flex", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={deal.productImage}
            alt=""
            width={500}
            height={630}
            style={{ objectFit: "cover", width: 500, height: 630 }}
          />
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 28,
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: "#DA1200",
              color: "#ffffff",
              fontSize: 30,
              fontWeight: 800,
              padding: "10px 20px",
              borderRadius: 14,
            }}
          >
            -{deal.maxDiscountPercent}% max
          </div>
        </div>

        {/* Info panel — right half, navy */}
        <div
          style={{
            width: 700,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#002356",
            padding: "40px 48px",
          }}
        >
          {/* Wordmark */}
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>
            <span style={{ color: "#ffffff" }}>grou</span>
            <span style={{ color: "#eaad00" }}>pal</span>
          </div>

          {/* Product title */}
          <div
            style={{
              display: "flex",
              fontSize: 42,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.15,
              marginTop: 12,
            }}
          >
            {deal.productName.length > 70 ? deal.productName.slice(0, 67) + "…" : deal.productName}
          </div>

          {/* Prices */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 26, color: "rgba(255,255,255,0.5)", textDecoration: "line-through" }}>
                {fmt(deal.originalPrice, deal.currency)}
              </span>
              <span style={{ fontSize: 22, color: "rgba(255,255,255,0.5)" }}>store price</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontSize: 68, fontWeight: 800, color: "#ffffff" }}>
                {fmt(computed.currentPrice, deal.currency)}
              </span>
              <span style={{ fontSize: 26, fontWeight: 700, color: "#eaad00" }}>Groupal price now</span>
            </div>
          </div>

          {/* Discount badges */}
          <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: zoneColor,
                borderRadius: 16,
                padding: "14px 24px",
              }}
            >
              <span style={{ fontSize: 34, fontWeight: 800, color: "#ffffff" }}>
                {computed.currentDiscountPercent.toFixed(1)}%
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, color: "#ffffff" }}>off right now</span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "2px solid #eaad00",
                borderRadius: 16,
                padding: "14px 24px",
              }}
            >
              <span style={{ fontSize: 34, fontWeight: 800, color: "#eaad00" }}>
                {deal.maxDiscountPercent}%
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, color: "#ffffff" }}>max if group fills</span>
            </div>
          </div>

          {/* Footer — buyers + deadline */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.2)",
              fontSize: 22,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <span>{deal.currentBuyerCount} of {deal.maxBuyersRequired} buyers joined</span>
            <span style={{ color: "#e86300", fontWeight: 700 }}>Ends {deadline}</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
