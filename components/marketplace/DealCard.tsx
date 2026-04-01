"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Share2, ShieldCheck, Heart, Clock, Users,
  Zap, ExternalLink, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./CountdownTimer";
import { cn } from "@/lib/utils";
import { Deal } from "@/lib/types/deal";
import { computeDealValues } from "@/lib/utils/deal-calculator";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style:               "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Milestone colors — fixed labels for scale row ────────────────────────────
const MILESTONE_COLORS = ["#eaad00", "#e86300", "#DA1200"] as const;

// ── Zone color — gold → orange → red as buyers fill milestones ────────────────
function getZoneColor(progressPercent: number, m1Pct: number, m2Pct: number): string {
  if (progressPercent <= m1Pct) return "#eaad00";
  if (progressPercent <= m2Pct) return "#e86300";
  return "#DA1200";
}

// ── Groupal Pricing Block (navy background) ───────────────────────────────────

function GroupalPricing({
  deal,
  computed,
}: {
  deal:     Deal;
  computed: ReturnType<typeof computeDealValues>;
}) {
  const m1Pct = (deal.milestones[0].buyerCount / deal.maxBuyersRequired) * 100;
  const m2Pct = (deal.milestones[1].buyerCount / deal.maxBuyersRequired) * 100;
  const zoneColor = getZoneColor(computed.progressPercent, m1Pct, m2Pct);

  return (
    <div style={{ backgroundColor: "#002356", borderRadius: 0 }}>

      {/* "groopal price" heading */}
      <div className="px-3 pt-2.5 pb-0">
        <span className="font-heading font-extrabold leading-none" style={{ fontSize: "0.85rem" }}>
          <span className="text-white">groo</span>
          <span style={{ color: "#eaad00" }}>pal</span>
          <span className="text-white"> price</span>
        </span>
      </div>

      {/* ── Scale row: discount% · buyer count per milestone ── */}
      <div className="flex items-center px-3 pt-1.5 pb-1">
        {deal.milestones.map((m, i) => (
          <div key={i} className="flex-1 flex items-center justify-center gap-1 min-w-0">
            <span
              className="font-heading font-extrabold tabular-nums leading-none"
              style={{ color: MILESTONE_COLORS[i], fontSize: "0.75rem" }}
            >
              {m.discountPercent}%
            </span>
            <span className="text-white/30 font-semibold leading-none" style={{ fontSize: "0.65rem" }}>-</span>
            <span className="flex items-center gap-0.5 text-white/60 font-semibold" style={{ fontSize: "0.65rem" }}>
              {m.buyerCount}
              <Users className="h-2.5 w-2.5" />
            </span>
          </div>
        ))}
      </div>

      {/* ── Progress bar — zone colored, animated on mount ── */}
      <div className="px-3 pt-1 pb-1.5">
        <div
          className="relative h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: zoneColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(computed.progressPercent, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Buyers count row */}
        <div className="flex items-center justify-between mt-1">
          <span
            className="flex items-center gap-1 font-semibold"
            style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6rem" }}
          >
            <Users className="h-2.5 w-2.5" />
            <span>
              <span className="text-white font-bold">{deal.currentBuyerCount}</span>
              {" of "}
              <span className="text-white font-bold">{deal.maxBuyersRequired}</span>
              {" buyers"}
            </span>
          </span>
          <span className="font-bold tabular-nums" style={{ color: zoneColor, fontSize: "0.6rem" }}>
            {computed.currentDiscountPercent.toFixed(1)}% off
          </span>
        </div>
      </div>

      {/* ── Current price — the hero ── */}
      <div className="px-3 pb-2.5">
        <span
          className="font-semibold uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.55rem" }}
        >
          Current price
        </span>
        <div
          className="font-heading font-extrabold tabular-nums leading-none mt-0.5 text-3xl text-white"
        >
          {formatPrice(computed.currentPrice, deal.currency)}
        </div>

        {/* Savings callout */}
        <div
          className="mt-1 flex items-center gap-1"
          style={{ fontSize: "0.6rem", color: "#eaad00" }}
        >
          <TrendingDown className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="text-white">
            Saving{" "}
            <span style={{ color: "#eaad00" }}>{formatPrice(computed.savingsAmount, deal.currency)}</span>
            {" · Every new buyer drops the price"}
          </span>
        </div>
      </div>

    </div>
  );
}

// ── Main DealCard ─────────────────────────────────────────────────────────────

export function DealCard({
  deal,
  onJoin,
  onBuyNow,
  onSave,
  onShare,
  className,
}: {
  deal:      Deal;
  onJoin?:   (id: string) => void;
  onBuyNow?: (id: string) => void;
  onSave?:   (id: string) => void;
  onShare?:  (id: string) => void;
  className?: string;
}) {
  const computed     = computeDealValues(deal);
  const hoursLeft    = (deal.deadlineAt.getTime() - Date.now()) / (1000 * 60 * 60);
  const isEndingSoon = hoursLeft > 0 && hoursLeft < 24;
  const isAlmostFull = computed.progressPercent >= 80 && computed.progressPercent < 100;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("group relative flex flex-col h-full cursor-pointer", className)}
    >
      <div className={cn(
        "relative flex flex-col flex-1 rounded-2xl bg-white overflow-hidden",
        "border border-gray-100 shadow-card group-hover:shadow-card-hover transition-shadow duration-200",
      )}>

        {/* ── Product image ─────────────────────────────────── */}
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: "58%" }}>
          <Image
            src={deal.productImage}
            alt={deal.productName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Discount badge — #eaad00 bg, #002356 text, always max discount */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-extrabold shadow-md"
              style={{ backgroundColor: "#DA1200", color: "#ffffff" }}
            >
              <Zap className="h-3 w-3 flex-shrink-0" style={{ fill: "#ffffff" }} />
              -{deal.maxDiscountPercent}%
            </span>
          </div>

          {/* Heart + Share — top right */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onSave?.(deal.id); }}
              aria-label="Save to favourites"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white transition-colors duration-150 shadow-sm cursor-pointer"
            >
              <Heart className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onShare?.(deal.id); }}
              aria-label="Share this deal"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-500 hover:text-groupal-navy hover:bg-white transition-colors duration-150 shadow-sm cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Status tags — bottom left — #1b4487 bg, white text, #EC0000 dot */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
            {isEndingSoon && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: "#1b4487" }}
              >
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#EC0000" }} />
                Ending Soon
              </span>
            )}
            {isAlmostFull && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: "#1b4487" }}
              >
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#EC0000" }} />
                Almost Full
              </span>
            )}
          </div>
        </div>

        {/* ── Card body ──────────────────────────────────────── */}
        <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-2.5">

          {/* Seller */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-400 truncate">{deal.sellerName}</span>
            {deal.sellerVerified && (
              <ShieldCheck
                className="h-3.5 w-3.5 flex-shrink-0"
                style={{ color: "#1b4487" }}
                aria-label="Verified seller"
              />
            )}
          </div>

          {/* Product name */}
          <h3
            className="font-heading font-bold text-groupal-navy leading-snug line-clamp-2"
            style={{ fontSize: "0.95rem" }}
          >
            {deal.productName}
          </h3>

          {/* IN STORE price — clickable link to seller site */}
          <a
            href={deal.sellerUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-between gap-2 w-full rounded-lg border border-gray-200 px-3 py-2 hover:border-gray-400 hover:bg-gray-50 transition-all duration-150 cursor-pointer group/store"
          >
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-gray-400 group-hover/store:text-gray-500">
                In Store Price
              </span>
              <span className="text-sm font-bold text-gray-400 line-through tabular-nums mt-0.5">
                {formatPrice(deal.originalPrice, deal.currency)}
              </span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover/store:text-gray-500 flex-shrink-0 transition-colors" />
          </a>

          {/* Groupal pricing block */}
          <div className="-mx-4">
            <GroupalPricing deal={deal} computed={computed} />
          </div>

          {/* Countdown + reservation amount */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#e86300" }} />
              <span className="text-xs font-medium text-gray-400">Ends in</span>
              <CountdownTimer targetDate={deal.deadlineAt} compact className="text-xs" />
            </div>
            <p className="font-medium text-gray-400" style={{ fontSize: "0.68rem" }}>
              Reserve your spot · Pay{" "}
              <span className="font-bold text-groupal-navy">
                {formatPrice(computed.reservationAmount, deal.currency)}
              </span>{" "}
              now (10%)
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2 mt-auto pt-1">
            <Button
              variant="default"
              size="default"
              className="w-full font-bold text-sm bg-[#1b4487] hover:bg-[#e86300] active:bg-[#e86300]/90"
              onClick={() => onJoin?.(deal.id)}
            >
              Join Group Buy
            </Button>
            <button
              onClick={() => onBuyNow?.(deal.id)}
              className="w-full text-center text-xs font-semibold text-gray-400 hover:text-groupal-orange transition-colors duration-150 cursor-pointer py-0.5"
            >
              Buy now at store price →
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function DealCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden animate-pulse">
      <div className="w-full bg-gray-200" style={{ paddingBottom: "58%" }} />
      <div className="px-4 pt-3 pb-4 space-y-3">
        <div className="h-3 w-1/3 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-10 w-full rounded-lg bg-gray-200" />
        <div className="h-24 w-full bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-10 w-full rounded-xl bg-gray-200 mt-2" />
        <div className="h-4 w-1/2 mx-auto rounded bg-gray-200" />
      </div>
    </div>
  );
}
