"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getMockDealById } from "@/lib/mock/deals"
import { Check, ArrowRight } from "lucide-react"

const REDIRECT_TARGET = "/dashboard" // "My Group Buys"

// ── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#eaad00", "#e86300", "#DA1200", "#048943", "#002356", "#1b4487"]

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left:  `${Math.random() * 100}%`,
    size:  Math.random() * 8 + 6,
    delay: Math.random() * 1.5,
    duration: Math.random() * 2 + 2,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left:   p.left,
            top:    -20,
            width:  p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{
            y:       ["0vh", "110vh"],
            rotate:  [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay:    p.delay,
            ease:     "easeIn",
            repeat:   0,
          }}
        />
      ))}
    </div>
  )
}

// ── Animated checkmark ────────────────────────────────────────────────────────

function AnimatedCheck() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="h-24 w-24 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "#048943" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 15 }}
        >
          <Check className="h-12 w-12 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>
    </div>
  )
}

// ── Inner page (uses useSearchParams, must be inside Suspense) ───────────────

function CheckoutSuccessInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const dealId       = searchParams.get("dealId") ?? ""
  const deal         = getMockDealById(dealId)

  const [closing, setClosing] = useState(false)

  function handleContinue() {
    // Fire the exit animation slightly before navigating so the window
    // reads as closing, not as an abrupt page swap.
    setClosing(true)
    setTimeout(() => router.push(REDIRECT_TARGET), 250)
  }

  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#002356]/60 backdrop-blur-sm px-4">
      <Confetti />

      <motion.div
        className="relative z-20 w-full max-w-sm rounded-3xl bg-white shadow-2xl px-8 py-10 text-center"
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={closing ? { opacity: 0, scale: 0.95, y: -8 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: closing ? 0.25 : 0.4, ease: "easeOut" }}
      >
        <div className="flex flex-col items-center gap-4">
          <AnimatedCheck />

          <motion.h1
            className="font-heading font-extrabold text-[#002356] text-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Congratulations on your purchase!
          </motion.h1>

          <motion.p
            className="text-gray-500 text-sm leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {deal
              ? `Your spot for ${deal.productName} is reserved. `
              : "Your spot is reserved. "}
            Now wait for the deal to close and see how much you saved with Groupal.
          </motion.p>
        </div>

        <motion.button
          onClick={handleContinue}
          className="mt-8 w-full py-3.5 rounded-xl font-extrabold text-[#002356] text-sm cursor-pointer transition-colors flex items-center justify-center gap-2"
          style={{ backgroundColor: "#eaad00" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d49c00")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#eaad00")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Let&apos;s see my deal status
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </main>
  )
}

// ── Page export (wraps inner in Suspense for useSearchParams) ─────────────────

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#002356]/60 backdrop-blur-sm">
        <div className="text-center text-white text-sm">Loading...</div>
      </main>
    }>
      <CheckoutSuccessInner />
    </Suspense>
  )
}
