import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"

// The platform-level share preview (the bare site link, not a specific
// deal — that's the sibling image at checkout/[dealId]/opengraph-image.tsx).
// Node runtime (not the next/og default of edge) so it can read the hero
// product photo straight off disk instead of round-tripping through an
// HTTP fetch of our own domain.
export const runtime = "nodejs"
export const alt = "Groupal, buy together, save massive"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  const imageBuffer = readFileSync(join(process.cwd(), "public/references/hero product one.png"))
  const imageBase64 = `data:image/png;base64,${imageBuffer.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#002356",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Subtle glow, same recipe as the real hero section */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(circle at 18% 20%, rgba(234,173,0,0.16) 0%, transparent 55%), radial-gradient(circle at 85% 80%, rgba(27,68,135,0.9) 0%, transparent 60%)",
          }}
        />

        {/* Wordmark */}
        <div style={{ display: "flex", fontSize: 54, fontWeight: 800, zIndex: 1 }}>
          <span style={{ color: "#ffffff" }}>grou</span>
          <span style={{ color: "#eaad00" }}>pal</span>
        </div>

        {/* Hero product shot */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageBase64}
          width={560}
          height={421}
          style={{ objectFit: "contain", marginTop: 8, zIndex: 1 }}
        />

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            color: "#eaad00",
            marginTop: 4,
            zIndex: 1,
          }}
        >
          Buy Together. Save Massive.
        </div>
      </div>
    ),
    { ...size }
  )
}
