"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { ShieldCheck, Users } from "lucide-react";
import { DealReachBadge } from "@/components/deal-reach-badge";
import { InStorePriceButton } from "./InStorePriceButton";
import type { DealReach } from "@/lib/types/deal";

type CompletedDeal = {
  id:                  string;
  productName:         string;
  productImage:        string;
  sellerName:          string;
  buyersJoined:        number;
  buyersTarget:        number;
  originalPrice:       number;
  finalPrice:          number;
  discountAchieved:    number;
  category:            string;
  reach?:              DealReach;
  externalProductUrl?: string;
};

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style:               "currency",
    currency:            "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CompletedDealCard({
  deal,
  variants,
  custom,
}: {
  deal:      CompletedDeal;
  variants?: Variants;
  custom?:   number;
}) {
  const savings = deal.originalPrice - deal.finalPrice;

  return (
    <motion.div
      variants={variants}
      custom={custom}
      // Fades in on MOUNT, not on scroll-into-view. whileInView (tried
      // first) relies on an IntersectionObserver that, empirically, some
      // cards in this long, dynamically-growing grid never fire for —
      // they'd stay stuck at opacity:0 forever even scrolled dead center
      // in the viewport, even after a full hard reload. That's a much
      // worse failure mode than losing the scroll-reveal flourish, so
      // every card just fades in immediately instead — guaranteed to
      // become visible, with no dependency on scroll position, mount
      // timing relative to siblings, or observer reliability at all.
      initial="hidden"
      animate="visible"
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* ── Product image ─────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: "55%" }}>
        <Image
          src={deal.productImage}
          alt={deal.productName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20" />

        {/* Discount badge — top left, green bg, white text (completed deal) */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-extrabold shadow-md text-white"
            style={{ backgroundColor: "#DA1200" }}
          >
            -{deal.discountAchieved}%
          </span>
        </div>

        {/* Success banner — bottom of image, full-width green */}
        <div
          className="absolute bottom-0 inset-x-0 flex items-center justify-center py-1.5 gap-1.5"
          style={{ backgroundColor: "#1b4487" }}
        >
          <span className="text-xs font-bold" style={{ color: "#ffffff" }}>Deal closed with massive savings!</span>
        </div>
      </div>

      {/* ── White body ─────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-3 flex flex-col gap-1.5">

        {/* Seller */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-400 truncate">{deal.sellerName}</span>
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#1b4487" }} aria-label="Verified seller" />
        </div>

        {/* Product name */}
        <h3
          className="font-heading font-bold text-groupal-navy leading-snug line-clamp-2"
          style={{ fontSize: "0.95rem" }}
        >
          {deal.productName}
        </h3>

        {deal.reach && <DealReachBadge reach={deal.reach} className="text-xs text-gray-400" />}

      </div>

      {/* ── Grooopal price section (navy) ───────────────────── */}
      <div style={{ backgroundColor: "#002356" }}>

        {/* In-store price — same position/styling as every other deal
            card's navy block and the checkout page's Review Deal step. */}
        <div className="px-3 pt-3">
          <InStorePriceButton price={deal.originalPrice} url={deal.externalProductUrl} />
        </div>

        {/* "groopal price" — now the label for the final price paid,
            instead of standing alone as its own separate heading above it. */}
        <div className="px-3 pt-2.5 pb-0">
          <span className="font-heading font-extrabold leading-none" style={{ fontSize: "0.7rem" }}>
            <span className="text-white">groo</span>
            <span style={{ color: "#eaad00" }}>pal</span>
            <span className="text-white"> price</span>
          </span>
          <div className="font-heading font-extrabold tabular-nums leading-none text-3xl text-white mt-0.5">
            {fmt(deal.finalPrice)}
          </div>
        </div>

        {/* Each buyer savings */}
        <div className="px-3 pt-1 pb-2.5">
          <div className="flex flex-col gap-0.5">
            <span
              className="font-semibold uppercase tracking-wider"
              style={{ color: "rgb(255, 255, 255)", fontSize: "0.65rem" }}
            >
              Each buyer <span style={{ color: "#eaad00", fontSize: "0.65rem", fontWeight: "bold" }}>saved</span>
            </span>
            <span
              className="font-heading font-extrabold tabular-nums leading-none text-3xl"
              style={{ color: "#eaad00" }}
            >
              {fmt(savings)}
            </span>
          </div>
        </div>

      </div>

      {/* ── Green footer: buyers participated ──────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ backgroundColor: "#1b4487" }}
      >
        <Users className="h-3.5 w-3.5 text-white flex-shrink-0" />
        <span className="text-xs font-semibold text-white">
          {deal.buyersJoined} of {deal.buyersTarget} buyers joined
        </span>
      </div>
    </motion.div>
  );
}
