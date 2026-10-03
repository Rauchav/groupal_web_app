"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

// Clerk's prebuilt <SignUp>/<SignIn> enforce the email field's format via a
// plain HTML `pattern` attribute, but — unlike the password field, which
// gets Clerk's own real-time error text ("must contain 8+ characters",
// breach-database checks, etc.) — render no visible error when that pattern
// fails. The Continue button just silently no-ops: no network request, no
// red border, nothing. From a buyer's side that reads as "the site is
// broken." This wraps the Clerk widget and surfaces our own error banner
// for exactly that one gap — nothing else about Clerk's flow (password
// rules, email verification, breach checks) needs touching, those already
// work.
//
// Deliberately read-only against Clerk's own DOM: an earlier version of
// this inserted an error <p> as a sibling of the email input, inside
// Clerk's own rendered tree — React's reconciler didn't expect that extra
// node and wiped the whole field (including whatever the buyer had typed)
// on Clerk's next re-render. This version only ever reads input value/
// validity; the error message itself renders as our own React-owned
// element below the whole Clerk card, never touching Clerk's subtree.
//
// Clerk names the relevant field "emailAddress" on <SignUp> and
// "identifier" on <SignIn> (its first step accepts email/username/phone
// depending on instance config — here it's email-only, same pattern either
// way). Targeting by `name` rather than Clerk's internal `cl-*` classes
// since `name` is the stable, documented part of the field, not an
// implementation detail that can shift on a Clerk version bump.
const EMAIL_FIELD_SELECTOR = 'input[name="emailAddress"], input[name="identifier"]'

export function EmailValidationGuard({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [invalid, setInvalid] = useState(false)
  // Plain DOM listeners (not React synthetic events) close over state from
  // whatever render was current when they were attached — since the effect
  // below only runs once, that closure would otherwise always see the
  // initial `invalid = false` and never notice a later error being shown.
  const invalidRef = useRef(false)
  useEffect(() => {
    invalidRef.current = invalid
  }, [invalid])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function isInvalid(input: HTMLInputElement): boolean {
      return input.value.trim() !== "" && !input.validity.valid
    }

    function handleBlur() {
      const input = inputRef.current
      if (input) setInvalid(isInvalid(input))
    }

    function handleInput() {
      const input = inputRef.current
      // Only live-clear an already-shown error — don't flash it on every
      // keystroke while the buyer is still mid-typing.
      if (input && invalidRef.current) setInvalid(isInvalid(input))
    }

    function attach(input: HTMLInputElement) {
      if (inputRef.current === input) return
      detach()
      inputRef.current = input
      input.addEventListener("blur", handleBlur)
      input.addEventListener("input", handleInput)
    }

    function detach() {
      if (inputRef.current) {
        inputRef.current.removeEventListener("blur", handleBlur)
        inputRef.current.removeEventListener("input", handleInput)
      }
      inputRef.current = null
    }

    // Clerk renders its widget asynchronously after mount, and swaps its
    // whole subtree when toggling between sign-in/sign-up on the seller
    // gate page — so the email input doesn't exist yet on first render, and
    // can be replaced by a different element entirely later.
    const observer = new MutationObserver(() => {
      const input = container.querySelector<HTMLInputElement>(EMAIL_FIELD_SELECTOR)
      if (input) attach(input)
      else {
        detach()
        setInvalid(false)
      }
    })
    observer.observe(container, { childList: true, subtree: true })

    const existing = container.querySelector<HTMLInputElement>(EMAIL_FIELD_SELECTOR)
    if (existing) attach(existing)

    // Capture phase so this runs before Clerk's own click handler, which
    // currently just silently no-ops on an invalid field anyway — this
    // only ever blocks a submit that was already going nowhere, and gives
    // the buyer the error message that was otherwise missing.
    function handleSubmitCapture(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('button[type="submit"]')) return
      const input = inputRef.current
      if (!input) return
      const bad = isInvalid(input)
      setInvalid(bad)
      if (bad) {
        e.preventDefault()
        e.stopPropagation()
        input.focus()
      }
    }
    container.addEventListener("click", handleSubmitCapture, { capture: true })

    return () => {
      observer.disconnect()
      detach()
      container.removeEventListener("click", handleSubmitCapture, { capture: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={containerRef}>
      {children}
      {invalid && (
        <p className="mt-3 text-center text-sm font-medium text-red-400">
          Enter a valid email address, like name@example.com
        </p>
      )}
    </div>
  )
}
