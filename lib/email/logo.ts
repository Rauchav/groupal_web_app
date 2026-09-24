import { readFileSync } from "fs"
import { join } from "path"

// Inlined as a base64 data URI rather than referenced by URL — email
// clients fetch <img src> over the open internet, so a URL pointing at
// APP_URL (localhost in dev) would render as a broken image in any real
// inbox. A data URI always renders, in dev or prod, with no dependency on
// hosting. Computed once and cached — every email send reuses it rather
// than re-reading/re-encoding the file from disk.
//
// PNG, not the SVG logo used everywhere else in the app: most email
// clients (Gmail included) don't render SVG <img> tags at all — they just
// show the alt text in a broken-image box.
//
// public/brand/logo fondo azul-email.png is a resized copy of public/
// brand/logo fondo azul.png (the source asset, untouched), scaled down
// from 4405x1092/77KB to 480x119/13KB via macOS's built-in `sips` (no new
// dependency) — the source file's full resolution pushed this email's
// total HTML past ~102KB, right at Gmail's clipping threshold, which cut
// the base64 data off mid-string and broke the image everywhere (desktop
// showed a broken-image icon, mobile fell back to the alt text). Display
// size in the header is 160x40; 480x119 keeps it crisp at up to 3x/retina
// without re-bloating the email. Re-run `sips -Z 480 <source> --out
// <this file>` if the source logo ever changes.
let cached: string | null = null

export function getLogoDataUri(): string {
  if (cached) return cached
  const png = readFileSync(join(process.cwd(), "public/brand/logo fondo azul-email.png"))
  cached = `data:image/png;base64,${png.toString("base64")}`
  return cached
}
