"use client"

import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Clock, Users, Shield, CreditCard, AlertCircle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// ── Discount table data for a sample $1,799 TV at 50% max with 40 buyers ──
const DISCOUNT_ROWS = [
  { buyers: 1,  discount: "1.25%",  price: "$1,776", savings: "$22",  isCurrent: false, isMax: false },
  { buyers: 5,  discount: "6.25%",  price: "$1,687", savings: "$112", isCurrent: false, isMax: false },
  { buyers: 10, discount: "12.5%",  price: "$1,574", savings: "$225", isCurrent: true,  isMax: false },
  { buyers: 20, discount: "25%",    price: "$1,349", savings: "$450", isCurrent: false, isMax: false },
  { buyers: 30, discount: "37.5%",  price: "$1,124", savings: "$675", isCurrent: false, isMax: false },
  { buyers: 40, discount: "50% MAX", price: "$899",  savings: "$900", isCurrent: false, isMax: true  },
]

const STEPS = [
  {
    number: 1,
    title: "Find Your Deal",
    image: "/display/step 1.png",
    description:
      "Browse hundreds of active group buy deals on electronics, cars, motorcycles, furniture, travel packages, and much more. Every deal shows you the current group price — which gets better as more people join. No sign-up needed to explore!",
  },
  {
    number: 2,
    title: "Reserve Your Spot",
    image: "/display/step 2.png",
    description:
      "Found something you love? Secure your place in the group by paying just 10% of the current group price, plus a small Groupal service fee. That's all you need to lock in your participation. Your spot is confirmed and the countdown begins!",
  },
  {
    number: 3,
    title: "Share & Watch the Price Drop",
    image: "/display/step 3.png",
    description:
      "Here's where the magic happens. Every single person who joins the group adds more discount for everyone — including you! Share the deal with friends, family, and colleagues. The more people join, the lower the price gets for the whole group. It's that simple.",
  },
  {
    number: 4,
    title: "Enjoy Your Savings",
    image: "/display/step 4.png",
    description:
      "When the deal closes, you automatically pay the remaining balance — the group price minus the discount your group earned, plus delivery. Then just sit back and wait for your amazing purchase to arrive!",
  },
]

const FAQS = [
  {
    q: "Is my reservation refundable?",
    a: "Your 10% reservation payment is refundable only if the seller cancels the deal. If the deal completes normally — whether at the deadline or when the group fills up — the reservation is applied toward your final payment.",
  },
  {
    q: "What if I change my mind after joining?",
    a: "We understand things come up! Unfortunately, once you've joined a group buy, we're unable to offer cancellations as your spot affects the group's discount for everyone. We encourage you to only join deals you're genuinely excited about.",
  },
  {
    q: "Can I join multiple group buys at the same time?",
    a: "Absolutely! You can join as many group buys as you like simultaneously. Each deal is independent, and you'll receive separate notifications for each one.",
  },
  {
    q: "How do I receive my purchase after the deal closes?",
    a: "It depends on the deal. Most items are delivered directly to your address. Some items — like vehicles — may require pickup at the seller's location. This information is clearly shown on every deal page before you join.",
  },
  {
    q: "Is Groupal safe to use?",
    a: "Absolutely. All payments are processed securely through industry-leading payment processors. Sellers are verified before listing deals, and we have a dedicated support team ready to help with any issues. Your peace of mind is our priority.",
  },
  {
    q: "How does Groupal make money?",
    a: "Groupal charges a small service fee (between 0.5% and 3%) on each reservation. This fee is shown clearly before you confirm any purchase — no hidden costs, ever.",
  },
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Section 1: Hero ─────────────────────────────────────────── */}
      <section
        className="relative pt-32 pb-20 px-4 text-center"
        style={{ backgroundColor: "#002356" }}
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading font-extrabold text-white text-4xl md:text-6xl leading-tight">
            How Groupal Works
          </h1>
          <p className="mt-4 text-white/80 text-xl md:text-2xl font-medium">
            The smarter way to buy big-ticket items — together.
          </p>
          <p className="mt-4 text-white/60 text-base md:text-lg max-w-xl mx-auto">
            Join a group, watch the price drop, and only pay in full once your deal is complete.
          </p>
        </div>
        {/* Scroll arrow */}
        <div className="mt-12 flex justify-center">
          <div className="animate-bounce">
            <ChevronDown className="h-8 w-8 text-white/40" />
          </div>
        </div>
      </section>

      {/* ── Section 2: The 4 Main Steps ─────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-extrabold text-[#002356] text-3xl md:text-4xl">
              Your journey from browse to save
            </h2>
          </div>

          <div className="space-y-20">
            {STEPS.map((step, idx) => {
              const isEven = idx % 2 === 1
              return (
                <div
                  key={step.number}
                  className={`flex flex-col gap-8 md:gap-12 ${
                    isEven ? "md:flex-row-reverse" : "md:flex-row"
                  } items-center`}
                >
                  {/* Image */}
                  <div className="w-full md:w-1/2">
                    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-gray-50" style={{ paddingBottom: "70%" }}>
                      <Image
                        src={step.image}
                        alt={`Step ${step.number} illustration`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain p-4"
                      />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="w-full md:w-1/2 space-y-4">
                    {/* Step badge */}
                    <div
                      className="inline-flex items-center justify-center h-12 w-12 rounded-full font-extrabold text-lg text-[#002356]"
                      style={{ backgroundColor: "#eaad00" }}
                    >
                      {step.number}
                    </div>
                    <h3 className="font-heading font-extrabold text-[#002356] text-2xl md:text-3xl">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Section 3: How the Discount Works ───────────────────────── */}
      <section className="py-20 px-4" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading font-extrabold text-[#002356] text-3xl md:text-4xl">
              Every buyer makes the price better for everyone
            </h2>
            <p className="mt-4 text-gray-600 text-base max-w-2xl mx-auto leading-relaxed">
              Unlike fixed discount tiers, Groupal's discount grows continuously. Every single buyer who joins adds the same
              percentage of discount for the entire group. This means joining early AND recruiting others both directly benefit
              your wallet.
            </p>
          </div>

          {/* Discount table */}
          <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#002356" }}>
                  <th className="px-5 py-4 text-left font-bold text-white">Buyers Joined</th>
                  <th className="px-5 py-4 text-left font-bold text-white">Discount</th>
                  <th className="px-5 py-4 text-left font-bold text-white">Group Price</th>
                  <th className="px-5 py-4 text-left font-bold text-white">You Save</th>
                </tr>
              </thead>
              <tbody>
                {DISCOUNT_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-100"
                    style={{
                      backgroundColor: row.isMax
                        ? "#eaad00"
                        : row.isCurrent
                        ? "#e8f4fd"
                        : i % 2 === 0
                        ? "#ffffff"
                        : "#f0f6ff",
                    }}
                  >
                    <td className="px-5 py-3.5 font-semibold text-gray-800">
                      {row.buyers} {row.buyers === 1 ? "buyer" : "buyers"}
                      {row.isCurrent && (
                        <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          ← current
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: row.isMax ? "#002356" : "#e86300" }}>
                      {row.discount}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#002356] tabular-nums">
                      {row.price}
                      {row.isMax && (
                        <span className="ml-2 text-xs font-extrabold text-[#002356] bg-white/60 px-2 py-0.5 rounded-full">
                          MAX DISCOUNT
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold tabular-nums" style={{ color: row.isMax ? "#002356" : "#048943" }}>
                      {row.savings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-center text-gray-500 text-sm leading-relaxed">
            The formula is simple: each new buyer adds{" "}
            <strong className="text-[#002356]">[maximum discount ÷ maximum buyers]</strong> percent to the group discount.
            Fair, transparent, and rewarding for everyone.
          </p>
        </div>
      </section>

      {/* ── Section 4: Two Ways a Deal Ends ─────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-extrabold text-[#002356] text-3xl md:text-4xl">
              When does a group buy close?
            </h2>
            <p className="mt-3 text-gray-500 text-base max-w-xl mx-auto">
              Every deal closes in one of two ways — and either way, everyone wins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl border-2 border-gray-100 p-8 space-y-4 shadow-sm">
              <div
                className="inline-flex items-center justify-center h-14 w-14 rounded-2xl"
                style={{ backgroundColor: "#eaad00" + "20" }}
              >
                <Clock className="h-7 w-7" style={{ color: "#eaad00" }} />
              </div>
              <h3 className="font-heading font-extrabold text-[#002356] text-xl">
                The Countdown Reaches Zero
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every group buy has a deadline set by the seller. When that time is up, the deal closes automatically
                with whatever discount the group has earned up to that point. Even if the group is not full, the deal still
                completes — you pay the remaining balance at whatever discount your group achieved.{" "}
                <strong className="text-[#002356]">No deal ever fails!</strong>
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border-2 border-gray-100 p-8 space-y-4 shadow-sm">
              <div
                className="inline-flex items-center justify-center h-14 w-14 rounded-2xl"
                style={{ backgroundColor: "#048943" + "20" }}
              >
                <Users className="h-7 w-7 text-[#048943]" />
              </div>
              <h3 className="font-heading font-extrabold text-[#002356] text-xl">
                The Group is Full
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                When the maximum number of buyers joins before the deadline — boom! The deal closes immediately at the maximum
                discount. Everyone in the group gets the best possible price. This is the dream scenario — and why sharing the
                deal with friends pays off so much!
              </p>
            </div>
          </div>

          {/* Reassurance banner */}
          <div
            className="mt-8 rounded-2xl px-6 py-5 text-center"
            style={{ backgroundColor: "#eaad00" }}
          >
            <p className="font-bold text-[#002356] text-base">
              ✨ Either way — your deal always completes. There is no such thing as a failed group buy on Groupal.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 5: Payment & What Happens If You Can't Pay ──────── */}
      <section className="py-20 px-4" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-extrabold text-[#002356] text-3xl md:text-4xl">
              About your payments
            </h2>
            <p className="mt-3 text-gray-500 text-base max-w-xl mx-auto">
              We've designed payments to be simple, transparent, and fair.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-gray-100">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-green-50">
                <Shield className="h-6 w-6 text-[#048943]" />
              </div>
              <h3 className="font-heading font-bold text-[#002356] text-base">
                Today: Reserve Your Spot
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                When you join a group buy, you pay 10% of the current group price plus a small Groupal service fee. This
                secures your spot and shows your commitment to the group. Think of it as a friendly handshake that says
                &quot;count me in!&quot;
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-gray-100">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-50">
                <CreditCard className="h-6 w-6 text-[#002356]" />
              </div>
              <h3 className="font-heading font-bold text-[#002356] text-base">
                When the Deal Closes: Final Payment
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Once the deal closes — either at the deadline or when the group is full — we'll automatically charge your
                saved payment method for the remaining 90% of the final group price, minus the discount your group earned.
                You'll receive a notification and email with all the details before this happens.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-gray-100">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-orange-50">
                <AlertCircle className="h-6 w-6" style={{ color: "#e86300" }} />
              </div>
              <h3 className="font-heading font-bold text-[#002356] text-base">
                Having trouble with your final payment?
              </h3>
              <div className="text-gray-600 text-sm leading-relaxed space-y-3">
                <p>
                  Life happens, and we completely understand that sometimes a payment might not go through — perhaps because
                  of insufficient funds, an expired card, or a temporary bank issue.
                </p>
                <p className="font-medium text-[#002356]">Don't worry! Here's what we do:</p>
                <p>🔔 We'll send you a friendly notification and email right away explaining what happened.</p>
                <p>⏳ You'll have a grace period to update your payment method or add funds. We'll send you gentle reminders to help you not miss this window.</p>
                <p>✅ Once you update your payment details, we'll process your payment automatically and you're all set!</p>
                <p className="text-gray-400 text-xs">
                  If we're unable to complete your payment within the grace period, your reservation will unfortunately be
                  cancelled and your initial 10% reservation payment will not be refunded. Our team is always here to help!
                  💙
                </p>
              </div>
            </div>
          </div>

          {/* Warning box */}
          <div className="mt-8 rounded-xl border-2 p-4 flex items-start gap-3" style={{ borderColor: "#e86300", backgroundColor: "#fff8f5" }}>
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#e86300" }} />
            <p className="text-sm text-gray-700">
              <strong className="font-bold" style={{ color: "#e86300" }}>Important:</strong> Please make sure your payment
              method is valid and has sufficient funds before the deal closes. We'll always give you advance notice!
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6: FAQ ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-extrabold text-[#002356] text-3xl md:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion multiple={false} className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-2 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-4 text-left font-semibold text-[#002356] hover:no-underline hover:text-[#1b4487] text-sm">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Section 7: CTA Banner ─────────────────────────────────────── */}
      <section
        className="py-24 px-4 text-center"
        style={{ backgroundColor: "#002356" }}
      >
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="font-heading font-extrabold text-white text-3xl md:text-5xl leading-tight">
            Ready to start saving together?
          </h2>
          <p className="text-white/70 text-base md:text-lg">
            Browse active group buys and join your first deal today. No commitment until you find something you love.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/deals"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-extrabold text-[#002356] text-base transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#eaad00" }}
            >
              Browse Deals
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-extrabold text-white text-base border-2 border-white/50 hover:border-white hover:bg-white/10 transition-all"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
