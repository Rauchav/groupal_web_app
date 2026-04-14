"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { getMockDealById } from "@/lib/mock/deals"
import { Check, Share2, LayoutDashboard } from "lucide-react"

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

// ── Timeline ──────────────────────────────────────────────────────────────────

const TIMELINE = [
  { icon: "✅", label: "Spot reserved",        done: true,  note: "Done!" },
  { icon: "📢", label: "Share the deal",       done: false, note: "Get more buyers to drop the price" },
  { icon: "⏰", label: "Wait for deal to close", done: false, note: "Deal closes at deadline" },
  { icon: "💳", label: "Final payment",        done: false, note: "Processed automatically" },
  { icon: "📦", label: "Receive your item",    done: false, note: "Delivered to your address" },
]

// ── Inner page (uses useSearchParams, must be inside Suspense) ───────────────

function CheckoutSuccessInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const dealId       = searchParams.get("dealId") ?? ""
  const deal         = getMockDealById(dealId)

  function handleShare() {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/deals/${dealId}`
      : `/deals/${dealId}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Share link copied to clipboard!")
    })
  }

  return (
    <main className="min-h-screen pt-24 pb-16 bg-gray-50">
      <Confetti />

      <div className="relative z-20 max-w-lg mx-auto px-4 text-center space-y-8">

        {/* Checkmark animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <AnimatedCheck />

          <div>
            <motion.h1
              className="font-heading font-extrabold text-[#002356] text-3xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {"You're in! 🎉"}
            </motion.h1>
            <motion.p
              className="text-gray-500 mt-1.5 text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Your spot is reserved. Watch the price drop as more buyers join!
            </motion.p>
          </div>
        </motion.div>

        {/* Deal summary card */}
        {deal && (
          <motion.div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="relative h-40 w-full">
              <Image
                src={deal.productImage}
                alt={deal.productName}
                fill
                className="object-cover"
                sizes="500px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-3 left-4 right-4 text-white font-bold text-base leading-snug line-clamp-2">
                {deal.productName}
              </p>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">by {deal.sellerName}</span>
              <span className="font-extrabold text-[#048943]">Reservation confirmed!</span>
            </div>
          </motion.div>
        )}

        {/* What happens next */}
        <motion.div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <h2 className="font-bold text-[#002356] text-base mb-4">What happens next</h2>
          <div className="space-y-3">
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${item.done ? "text-[#048943]" : "text-gray-700"}`}>
                    {item.label}
                    {item.done && (
                      <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full bg-[#048943]/10 text-[#048943] text-[10px] font-bold">
                        Done!
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-2xl font-extrabold text-[#002356] text-base cursor-pointer transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: "#eaad00" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d49c00")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#eaad00")}
          >
            <Share2 className="h-5 w-5" />
            Share This Deal
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 rounded-2xl font-extrabold text-[#002356] text-base cursor-pointer border-2 border-[#002356] hover:bg-[#002356] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="h-5 w-5" />
            View My Dashboard
          </button>
        </motion.div>

      </div>
    </main>
  )
}

// ── Page export (wraps inner in Suspense for useSearchParams) ─────────────────

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-24 pb-16 bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400 text-sm">Loading...</div>
      </main>
    }>
      <CheckoutSuccessInner />
    </Suspense>
  )
}
