"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface CitySuggestion {
  id: string
  city: string
  label: string
}

// Free-text city input for a seller's own headquarters location
// (onboarding + settings — see the "Headquarters City" label at both call
// sites) with a live dropdown of real places as the seller types, backed
// by /api/geocode/cities (a proxy to OpenStreetMap's free Nominatim
// geocoder — no Google Maps key needed). This is deliberately the ONLY
// place SellerProfile.city is used: it has nothing to do with a deal's
// own geographic reach (city/country/continent, set per-deal at creation
// — see lib/types/deal.ts's own comment and CLAUDE.md's note on the two
// staying separate concepts).
export function CityAutocomplete({
  value,
  onChange,
  placeholder,
  hasError,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hasError?: boolean
}) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep the visible text in sync if the form resets/loads a different
  // value out from under us (e.g. settings page hydrating profile.city).
  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
      abortRef.current?.abort()
    }
  }, [])

  function handleInputChange(text: string) {
    setQuery(text)
    onChange(text)
    setOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const res = await fetch(`/api/geocode/cities?q=${encodeURIComponent(text)}`, { signal: controller.signal })
        const data = await res.json()
        setSuggestions(data.results ?? [])
      } catch {
        // Aborted (a newer keystroke superseded this request) or a network
        // hiccup — either way, leave the field as plain free text.
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  function selectSuggestion(s: CitySuggestion) {
    setQuery(s.label)
    onChange(s.label)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay so a click on a dropdown item registers before we hide it.
            blurTimeoutRef.current = setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false)
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full h-11 pl-9 pr-3 rounded-xl border text-sm outline-none transition-all",
            "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
            hasError ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
          )}
        />
      </div>

      {open && (loading || suggestions.length > 0) && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {loading && suggestions.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-gray-400">Searching…</div>
          ) : (
            suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
