"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useInView, animate } from "framer-motion";
import {
  Users,
  Zap,
  ArrowRight,
  Tv,
  Car,
  Laptop,
  Smartphone,
  Home,
  HeartPulse,
  Shirt,
  Sparkles,
  Dumbbell,
  Plane,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealCard, DealCardSkeleton } from "@/buyers/components/marketplace/DealCard";
import { CompletedDealCard } from "@/buyers/components/marketplace/CompletedDealCard";
import { BuyerReviews } from "@/buyers/components/marketplace/BuyerReviews";
import { HeroCarousel } from "@/buyers/components/marketplace/HeroCarousel";
import { COMPLETED_DEALS } from "@/lib/mock/deals";
import { useApiGet } from "@/lib/api/use-fetch";
import { apiDealToDeal, type ApiDeal } from "@/lib/api/deal-adapter";
import { computeDealValues } from "@/lib/utils/deal-calculator";

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
// Every label here is a real category (lib/constants/categories.ts) now, so
// each tile links straight into /deals?category=<label> with no alias
// translation needed — see that file's own comment for why this list is the
// single source of truth every category picker in the app reads from.
const CATEGORIES = [
  { label: "Electronics", icon: Tv,         count: 89  },
  { label: "Motors",      icon: Car,        count: 62  },
  { label: "Computers",   icon: Laptop,     count: 74  },
  { label: "Smartphones", icon: Smartphone, count: 115 },
  { label: "Home",        icon: Home,       count: 67  },
  { label: "Health",      icon: HeartPulse, count: 41  },
  { label: "Fashion",     icon: Shirt,      count: 97  },
  { label: "Leisure",     icon: Sparkles,   count: 38  },
  { label: "Sports",      icon: Dumbbell,   count: 53  },
  { label: "Travels",     icon: Plane,      count: 53  },
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
  { numeric: 2.4,   prefix: "$", suffix: "M+", decimals: 1, label: "Saved by buyers"       },
  { numeric: 847,   prefix: "",  suffix: "",    decimals: 0, label: "Successful group buys" },
  { numeric: 12000, prefix: "",  suffix: "+",   decimals: 0, label: "Happy buyers"          },
  { numeric: 70,    prefix: "",  suffix: "%",   decimals: 0, label: "Max discount achieved" },
] as const;

// ── Animated stat counter ────────────────────────────────────────────────────
function StatCounter({
  numeric,
  prefix,
  suffix,
  decimals,
  label,
  custom,
}: {
  numeric:  number;
  prefix:   string;
  suffix:   string;
  decimals: number;
  label:    string;
  custom:   number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, numeric, {
      duration: 2,
      ease: "easeOut",
      onUpdate(value) { setCount(value); },
    });
    return () => controls.stop();
  }, [isInView, numeric]);

  const formatted =
    decimals > 0
      ? count.toFixed(decimals)
      : Math.round(count).toLocaleString("en-US");

  return (
    <motion.div ref={ref} variants={fadeUp} custom={custom} className="text-center">
      <div
        className="font-heading font-extrabold tabular-nums mb-1"
        style={{ color: "#eaad00", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1 }}
      >
        {prefix}{formatted}{suffix}
      </div>
      <div className="text-sm font-medium text-white/60">{label}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  // Real deals now (app/api/deals — Postgres via Prisma), not MOCK_DEALS.
  const { data: dealsData, loading: loadingDeals, refetch: refetchActive } = useApiGet<{ deals: ApiDeal[] }>("/api/deals?status=active");
  const { data: completedData, refetch: refetchCompleted } = useApiGet<{ deals: ApiDeal[] }>("/api/deals?status=completed");

  // No real job scheduler yet (see app/api/jobs/sweep) — sweep for deals
  // that hit their deadline or max buyer count on every homepage visit,
  // then re-fetch both lists so a just-closed deal moves from "Active
  // Group Buys" into "Deals That Delivered" without a second reload.
  useEffect(() => {
    fetch("/api/jobs/sweep", { method: "POST" })
      .then(() => { refetchActive(); refetchCompleted(); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Biggest discount first — matches the -X% badge every card leads with,
  // so the deals buyers save the most on are the first thing they see.
  const liveDeals = (dealsData?.deals ?? [])
    .map(apiDealToDeal)
    .sort((a, b) => b.maxDiscountPercent - a.maxDiscountPercent);
  const dealsThatDelivered = [
    ...(completedData?.deals ?? []).map(apiDealToDeal).map((deal) => {
      const computed = computeDealValues(deal);
      return {
        id:               deal.id,
        productName:      deal.productName,
        productImage:     deal.productImages[0],
        sellerName:       deal.sellerName,
        buyersJoined:     deal.currentBuyerCount,
        buyersTarget:     deal.maxBuyersRequired,
        originalPrice:    deal.originalPrice,
        finalPrice:       computed.currentPrice,
        discountAchieved: Math.round(computed.currentDiscountPercent),
        category:         deal.category,
        reach:            deal.reach,
        externalProductUrl: deal.externalProductUrl || deal.sellerUrl,
      };
    }),
    ...COMPLETED_DEALS,
  ];

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
          <motion.div
            className="flex items-center justify-between mb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0}
          >
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
                Join before time runs out, <span style={{ fontWeight: "bold" }}>these deals need you</span>.
              </p>
            </div>
            <Button
              variant="outline-navy"
              size="sm"
              className="hidden sm:flex gap-1.5"
              onClick={() => router.push("/deals")}
            >
              View all deals
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

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
              {liveDeals.map((deal, i) => (
                <motion.div key={deal.id} variants={fadeUp} custom={i} className="h-full">
                  <DealCard deal={deal} className="h-full" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Mobile "View All" */}
          <div className="mt-8 text-center sm:hidden">
            <Button
              variant="outline-navy"
              size="default"
              className="gap-1.5"
              onClick={() => router.push("/deals")}
            >
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
          <motion.div
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              className="font-heading font-extrabold text-white mb-3"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
            >
              How Groupal Works?
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              <span className="font-bold" style={{ color: "#eaad00" }}>Four simple</span> steps from browsing to receiving your product with an <span className="font-bold" style={{ color: "#eaad00" }}>incredible group discount.</span>
            </p>
          </motion.div>
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
          <motion.div
            className="text-center mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              className="font-heading font-extrabold text-white mb-2"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
            >
              Shop by Category
            </h2>
            <p className="text-white/50 text-sm">
              Group buys across every big-ticket category
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-5 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {CATEGORIES.map(({ label, icon: Icon, count }, i) => (
              <motion.a
                key={label}
                href={`/deals?category=${encodeURIComponent(label)}`}
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
            {STATS.map(({ numeric, prefix, suffix, decimals, label }, i) => (
              <StatCounter
                key={label}
                numeric={numeric}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
                label={label}
                custom={i}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. COMPLETED DEALS
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
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
              Real group buys that reached their target, and changed the price.
            </p>
          </motion.div>

          {/* Plain grid, not a motion.div: each CompletedDealCard now
              triggers its own whileInView independently (see that
              component's own comment) rather than inheriting a stagger
              orchestrated here, since the real deals in this list arrive
              from an async fetch and can mount well after this section's
              own one-time viewport trigger would have already fired. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dealsThatDelivered.map((deal, i) => (
              <CompletedDealCard key={deal.id} deal={deal} variants={fadeUp} custom={i} />
            ))}
          </div>

          <BuyerReviews variants={fadeUp} custom={dealsThatDelivered.length} />
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
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-heading font-extrabold text-white mb-4 leading-tight"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
            >
              Ready to save massive?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-white/60 text-lg mb-8 max-w-lg mx-auto"
            >
              Join thousands of buyers who are already saving big on the things
              they love.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Button
                variant="gold"
                size="xl"
                className="w-full sm:w-auto font-bold text-base"
                onClick={() => router.push("/deals")}
              >
                Browse Live Deals
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto font-bold text-base"
                onClick={() => router.push("/sign-up")}
              >
                Create Free Account
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
