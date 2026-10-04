import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"
import { loadNunitoExtraBold } from "@/lib/og/nunito-font"

// The platform-level share preview (the bare site link, not a specific
// deal — that's the sibling image at checkout/[dealId]/opengraph-image.tsx).
// Layout/colors match the reference mockups at public/references/
// "groupal platform share image.png" and "groupal deal share image.png"
// (both use the same #1b4487 background, not the darker #002356 navy used
// elsewhere in the app). Node runtime (not the next/og default of edge) so
// it can read the logo/hero photo straight off disk instead of
// round-tripping through an HTTP fetch of our own domain.
export const runtime = "nodejs"
export const alt = "Groupal, buy together, save massive"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

function toDataUri(path: string): string {
  const buffer = readFileSync(join(process.cwd(), path))
  return `data:image/png;base64,${buffer.toString("base64")}`
}

export default function Image() {
  const heroImage = toDataUri("public/references/hero product one.png")
  // Same white-wordmark-on-transparent asset used in the email header
  // (emails/EmailShell.tsx) — per the reference mockup, this replaces the
  // hand-rendered "grou"/"pal" text that used to sit here.
  const logoImage = toDataUri("public/brand/logo fondo azul-email.png")
  const nunitoExtraBold = loadNunitoExtraBold()

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
          backgroundColor: "#1b4487",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo — white wordmark + gold mark, centered above the laptop */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoImage} width={360} height={89} style={{ objectFit: "contain" }} />

        {/* Hero product shot */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          width={560}
          height={421}
          style={{ objectFit: "contain", marginTop: 12 }}
        />

        {/* Tagline — same Nunito ExtraBold the homepage H1 uses. gap (not a
            trailing space character) separates the two colored spans —
            Satori collapses whitespace-only text between flex-item spans
            no matter how it's authored, especially with a custom embedded
            font. */}
        <div style={{ display: "flex", fontFamily: "Nunito", fontSize: 34, fontWeight: 800, marginTop: 10, gap: 10 }}>
          <span style={{ color: "#ffffff" }}>Buy together,</span>
          <span style={{ color: "#eaad00" }}>save massive</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Nunito", data: nunitoExtraBold, weight: 800, style: "normal" }] }
  )
}
