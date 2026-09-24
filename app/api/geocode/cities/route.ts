import { NextResponse } from "next/server"

// GET /api/geocode/cities?q=<query> — server-side proxy to OpenStreetMap's
// free Nominatim geocoder, powering sellers/components/CityAutocomplete.tsx
// (the seller headquarters-city field on onboarding + settings). Proxied
// server-side rather than called directly from the browser because
// Nominatim's usage policy requires every client identify itself via a
// custom User-Agent header — browsers block scripts from setting that
// header on fetch/XHR requests, so a direct client-side call would violate
// the policy and risk the app getting rate-limited/blocked.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const USER_AGENT = "Groupal/1.0 (+https://groupal-web-app.vercel.app; contact: deploytherocket@gmail.com)"

interface NominatimResult {
  place_id: number
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    country?: string
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()
  if (q.length < 2) return NextResponse.json({ results: [] })

  const url = new URL(NOMINATIM_URL)
  url.searchParams.set("q", q)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("limit", "8")

  let data: NominatimResult[]
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return NextResponse.json({ results: [] })
    data = await res.json()
  } catch {
    // Nominatim down, timed out, or rate-limited — fail soft. The city
    // field still works as a plain text input either way.
    return NextResponse.json({ results: [] })
  }

  // Nominatim's free-text search also returns streets, buildings, and
  // points of interest — keep only results that resolve to an actual
  // city/town, since that's the only thing that makes sense as a company
  // headquarters location. De-dupe by display label (a big city can match
  // multiple raw results — an admin boundary and a place node, etc).
  const seen = new Set<string>()
  const results: { id: string; city: string; label: string }[] = []
  for (const r of data) {
    const city = r.address?.city ?? r.address?.town ?? r.address?.village ?? r.address?.municipality
    if (!city) continue
    const label = [city, r.address?.state, r.address?.country].filter(Boolean).join(", ")
    if (seen.has(label)) continue
    seen.add(label)
    results.push({ id: String(r.place_id), city, label })
    if (results.length >= 6) break
  }

  return NextResponse.json({ results })
}
