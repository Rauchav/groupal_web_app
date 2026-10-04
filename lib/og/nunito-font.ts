import { readFileSync } from "fs"
import { join } from "path"

// Satori (next/og's renderer) has no access to the app's actual Nunito web
// font — font-heading, used by every real H1 including the homepage hero's
// "Buy Together. Save Massive." (see HeroCarousel.tsx) — unless it's handed
// the raw font file directly. public/fonts/Nunito-ExtraBold.ttf is the same
// weight (800) the H1 uses, downloaded once from Google Fonts' CSS2 API
// (it serves a .ttf rather than .woff2 when requested with an old-browser
// User-Agent) rather than fetched over the network on every image render.
export function loadNunitoExtraBold(): ArrayBuffer {
  const buffer = readFileSync(join(process.cwd(), "public/fonts/Nunito-ExtraBold.ttf"))
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}
