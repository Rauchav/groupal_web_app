"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"

// Shared confetti + animated-checkmark celebration shell, extracted from
// app/(buyers)/checkout/success/page.tsx — genuinely generic UI (a
// "something worked" moment), unlike almost everything else in this repo,
// so it lives at the component-tree root alongside providers.tsx rather
// than under either portal's own component tree or components/ui/ (which
// per the buyer/seller separation work is reserved for shadcn primitives).
// Both the buyer checkout-success route and the seller offer-published
// route render this, supplying only their own copy and destination.

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

export function SuccessCelebration({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title:       string
  description: ReactNode
  ctaLabel:    string
  // Navigated to (via router.push) after a brief closing animation, so the
  // card reads as closing rather than an abrupt page swap.
  ctaHref:     string
}) {
  const router = useRouter()
  const [closing, setClosing] = useState(false)

  function handleContinue() {
    setClosing(true)
    setTimeout(() => router.push(ctaHref), 250)
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
            {title}
          </motion.h1>

          <motion.p
            className="text-gray-500 text-sm leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {description}
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
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </main>
  )
}
