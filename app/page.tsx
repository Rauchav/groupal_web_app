"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Users,
  Zap,
  ArrowRight,
  Cog,
  Shirt,
  Cpu,
  Home,
  Gauge,
  Plane,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DealCard, DealCardSkeleton } from "@/components/marketplace/DealCard";
import { CompletedDealCard } from "@/components/marketplace/CompletedDealCard";
import { HeroCarousel } from "@/components/marketplace/HeroCarousel";
import { COMPLETED_DEALS } from "@/lib/mockDeals";
import { MOCK_DEALS } from "@/lib/mock/deals";

// ── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Category data ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "Motors",       icon: Cog,        count: 62  },
  { label: "Fashion",      icon: Shirt,      count: 97  },
  { label: "Technology",   icon: Cpu,        count: 89  },
  { label: "Home",         icon: Home,       count: 67  },
  { label: "Gadgets",      icon: Gauge,      count: 115 },
  { label: "Travel",       icon: Plane,      count: 53  },
  { label: "Experiences",  icon: Sparkles,   count: 31  },
] as const;

// ── How it works ────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step:  "01",
    img:   "/display/step 1.svg",
    title: "Browse & Pick",
    desc:  "Discover massive savings unlocked by the power of group buying. Browse deals on smart TVs, vehicles, tech, clothing, appliances, vacation packages, and much more.",
  },
  {
    step:  "02",
    img:   "/display/step 2.svg",
    title: "Reserve Your Spot",
    desc:  "Pay just 10% upfront to secure your place in the group buy. Your purchase is granted, but the final discount applied to it will be defined when the group buy deal is closed.",
  },
  {
    step:  "03",
    img:   "/display/step 3.svg",
    title: "Share & Recruit",
    desc:  "Spread the word to friends, family, coworkers or even strangers. The more buyers join in, the more discount you get",
  },
  {
    step:  "04",
    img:   "/display/step 4.svg",
    title: "Deal Closed, everybody Win!",
    desc:  "As soons as the expiration date is reaached or the group is full, the final discount will be set and activated. You pay the remaining 90%, minus the massive groupal discount. Enjoy your purchase!",
  },
] as const;

// ── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "$2.4M+",  label: "Saved by buyers"        },
  { value: "847",     label: "Successful group buys"   },
  { value: "12,000+", label: "Happy buyers"            },
  { value: "70%",     label: "Max discount achieved"   },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [loadingDeals] = useState(false);

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ══════════════════════════════════════════════════════
          1. HERO CAROUSEL
      ══════════════════════════════════════════════════════ */}
      <HeroCarousel />

      {/* ══════════════════════════════════════════════════════
          2. LIVE DEALS GRID
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-[#f8fafc]" id="deals">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-7 w-7 text-groupal-orange fill-groupal-orange" />
                <h2
                  className="font-heading font-extrabold text-groupal-navy"
                  style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
                >
                  Active Group Buys
                </h2>
              </div>
              <p className="text-gray-500 text-sm">
                Join before time runs out — these deals need you.
              </p>
            </div>
            <Button variant="outline-navy" size="sm" className="hidden sm:flex gap-1.5">
              View all deals
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid */}
          {loadingDeals ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <DealCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
            >
              {MOCK_DEALS.map((deal, i) => (
                <motion.div key={deal.id} variants={fadeUp} custom={i} className="h-full">
                  <DealCard
                    deal={deal}
                    onJoin={(id) => console.log("join", id)}
                    onBuyNow={(id) => console.log("buy-now", id)}
                    onSave={(id) => console.log("save", id)}
                    onShare={(id) => console.log("share", id)}
                    className="h-full"
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Mobile "View All" */}
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline-navy" size="default" className="gap-1.5">
              View all deals
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3. HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="pb-16 md:pb-24 bg-white" id="how-it-works">
        {/* Full-width navy banner — flush with section top */}
        <div className="w-full py-16" style={{ backgroundColor: "#002356" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2
              className="font-heading font-extrabold text-white mb-3"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
            >
              How Groupal Works?
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              <span className="font-bold" style={{ color: "#eaad00" }}>Four simple</span> steps from browsing to receiving your product with an <span className="font-bold" style={{ color: "#eaad00" }}>incredible group discount.</span>
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >

            {HOW_IT_WORKS.map(({ step, img, title, desc }, i) => (
              <motion.div
                key={step}
                variants={fadeUp}
                custom={i}
                className="relative z-10 flex flex-col items-center text-center"
              >
                {/* Illustration */}
                <div className="relative w-full max-w-[240px] mb-5 drop-shadow-md" style={{ aspectRatio: "1 / 1" }}>
                  <Image
                    src={img}
                    alt={title}
                    fill
                    sizes="240px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
                {/* Step number tag */}
                <span
                  className="inline-block text-xs font-bold mb-3 tracking-widest px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#eaad00", color: "#002356" }}
                >
                  STEP {step}
                </span>
                <h3 className="font-heading font-bold text-groupal-navy text-lg mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4. CATEGORIES SHOWCASE
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20" style={{ backgroundColor: "#002356" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              className="font-heading font-extrabold text-white mb-2"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
            >
              Shop by Category
            </h2>
            <p className="text-white/50 text-sm">
              Group buys across every big-ticket category
            </p>
          </div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {CATEGORIES.map(({ label, icon: Icon, count }, i) => (
              <motion.a
                key={label}
                href="#"
                variants={fadeUp}
                custom={i}
                className="group flex flex-col items-center gap-2.5 rounded-2xl p-4 cursor-pointer transition-all duration-200"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                whileHover={{ backgroundColor: "rgba(234,173,0,0.15)", scale: 1.03 }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200"
                  style={{ backgroundColor: "rgba(234,173,0,0.15)" }}
                >
                  <Icon
                    className="h-6 w-6 transition-colors duration-200"
                    style={{ color: "#eaad00" }}
                  />
                </div>
                <span className="text-xs font-semibold text-white/80 group-hover:text-white text-center leading-tight transition-colors">
                  {label}
                </span>
                <span className="text-[0.65rem] font-medium text-white/30 group-hover:text-groupal-gold/70 transition-colors">
                  {count} deals
                </span>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5. STATS BANNER
      ══════════════════════════════════════════════════════ */}
      <section
        className="py-14 md:py-16"
        style={{ backgroundColor: "#1b4487" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {STATS.map(({ value, label }, i) => (
              <motion.div
                key={label}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <div
                  className="font-heading font-extrabold tabular-nums mb-1"
                  style={{
                    color: "#eaad00",
                    fontSize: "clamp(2rem, 4vw, 3rem)",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div className="text-sm font-medium text-white/60">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. COMPLETED DEALS
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-7 w-7" style={{ fill: "#048943", color: "white" }} />
              <h2
                className="font-heading font-extrabold text-groupal-navy"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
              >
                Deals That Delivered
              </h2>
            </div>
            <p className="text-gray-500 text-sm">
              Real group buys that reached their target — and changed the price.
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {COMPLETED_DEALS.map((deal, i) => (
              <CompletedDealCard key={deal.id} deal={deal} variants={fadeUp} custom={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          7. BOTTOM CTA BAND
      ══════════════════════════════════════════════════════ */}
      <section
        className="py-16 md:py-20"
        style={{ backgroundColor: "#002356" }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="font-heading font-extrabold text-white mb-4 leading-tight"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
            >
              Ready to save massive?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of buyers who are already saving big on the things
              they love.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="gold" size="xl" className="w-full sm:w-auto font-bold text-base">
                Browse Live Deals
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="xl" className="w-full sm:w-auto font-bold text-base">
                Create Free Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
