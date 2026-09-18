"use client"

import { useCallback, useEffect, useState } from "react"

// A deliberately small GET hook — no caching/dedup/invalidation (that's
// what a real query library would add later; see CLAUDE.md's migration
// notes). Pass null for url to skip fetching (e.g. while a required id
// isn't known yet). `refetch` re-runs the same request, for the handful
// of places that need to pull fresh data after a mutation elsewhere
// (e.g. after creating or deleting a deal).
export function useApiGet<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!url) {
      setData(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        if (json?.error) throw new Error(typeof json.error === "string" ? json.error : "Request failed")
        setData(json)
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [url, tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, refetch }
}
