"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, CheckCircle2, BadgePercent, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRODUCT_IMAGES = [
  { id: "laptop",     src: "/references/hero product one.png", alt: "MacBook Pro — group buy deal"    },
  { id: "smartwatch", src: "/references/hero product two.png", alt: "Smartwatch — group buy deal" },
] as const;

const TRUST = [
  { icon: Shield,       label: "Secure Payments" },
  { icon: CheckCircle2, label: "Verified Sellers" },
  { icon: BadgePercent, label: "Real Savings"      },
  { icon: Star,         label: "100% Guaranteed"  },
] as const;

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % PRODUCT_IMAGES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const img = PRODUCT_IMAGES[current];

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "#002356" }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #eaad00 0%, transparent 60%), radial-gradient(circle at 80% 20%, #1b4487 0%, transparent 60%)",
        }}
      />

      <div
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: "7.5rem" }}
      >
        {/* ── Two-column layout: text left (static), image right (fades) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center min-h-[400px] pb-10">

          {/* LEFT — animates once on mount */}
          <motion.div
            className="flex flex-col justify-center order-2 md:order-1 text-center md:text-left"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
            }}
          >
            {/* Eyebrow */}
            <motion.div
              className="mb-5"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } } }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(234,173,0,0.15)",
                  color:           "#eaad00",
                  border:          "1px solid rgba(234,173,0,0.3)",
                }}
              >
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-groupal-gold opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-groupal-gold" />
                </span>
                12,847 buyers saved this month
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="font-heading font-extrabold text-white leading-[1.05] tracking-tight mb-4"
              style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } } }}
            >
              Buy Together.
              <br />
              <span style={{ color: "#eaad00" }}>Save Massive.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="text-base md:text-lg text-white/70 leading-relaxed mb-8 max-w-md mx-auto md:mx-0"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } } }}
            >
              Join group buys on big-ticket items and unlock discounts of{" "}
              <strong className="text-white">up to 70%</strong>. The more who
              join, the more you save.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap items-center justify-center md:justify-start gap-3"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } } }}
            >
              <Button variant="gold" size="lg" className="font-bold">
                Browse Deals
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="font-bold">
                How It Works
              </Button>
            </motion.div>
          </motion.div>

          {/* RIGHT — only the image fades */}
          <div className="relative flex items-center justify-center order-1 md:order-2">
            <div className="relative w-full" style={{ aspectRatio: "3 / 2", maxWidth: "520px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 768px) 90vw, 44vw"
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* Trust badges */}
      <div
        className="relative border-t mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.9 } },
          }}
        >
          {TRUST.map(({ icon: Icon, label }) => (
            <motion.div
              key={label}
              className="flex items-center gap-1.5 text-xs font-medium text-white/50"
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
              }}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#eaad00" }} />
              {label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
