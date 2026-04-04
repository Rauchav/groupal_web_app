"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Share2, ShieldCheck, Users } from "lucide-react";

type CompletedDeal = {
  id:               string;
  productName:      string;
  productImage:     string;
  sellerName:       string;
  buyersJoined:     number;
  buyersTarget:     number;
  originalPrice:    number;
  finalPrice:       number;
  discountAchieved: number;
  category:         string;
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
            style={{ backgroundColor: "#048943" }}
          >
            -{deal.discountAchieved}%
          </span>
        </div>

        {/* Share — top right */}
        <div className="absolute top-3 right-3 z-10">
          <button
            aria-label="Share this deal"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-500 hover:bg-white transition-colors duration-150 shadow-sm cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Success banner — bottom of image, full-width green */}
        <div
          className="absolute bottom-0 inset-x-0 flex items-center justify-center py-1.5 gap-1.5"
          style={{ backgroundColor: "#1b4487" }}
        >
          <span className="text-xs font-bold" style={{ color: "#eaad00" }}>Deal closed with massive savings!</span>
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

        {/* Price in store */}
        <div className="inline-flex items-center justify-between gap-2 w-full rounded-lg border border-gray-200 px-3 py-2">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-gray-400">
            Price in Store
          </span>
          <span className="text-sm font-bold text-gray-400 tabular-nums">
            {fmt(deal.originalPrice)}
          </span>
        </div>

      </div>

      {/* ── Grooopal price section (navy) ───────────────────── */}
      <div style={{ backgroundColor: "#002356" }}>

        {/* "groopal price" heading */}
        <div className="px-3 pt-2.5 pb-0">
          <span className="font-heading font-extrabold leading-none" style={{ fontSize: "0.85rem" }}>
            <span className="text-white">groo</span>
            <span style={{ color: "#eaad00" }}>pal</span>
            <span className="text-white"> price</span>
          </span>
        </div>

        {/* PRICED PAYED + large final price */}
        <div className="px-3 pt-1.5 pb-0">
          <span
            className="font-semibold uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.55rem" }}
          >
            Priced Payed
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
              style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.55rem" }}
            >
              Each buyer savings
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
