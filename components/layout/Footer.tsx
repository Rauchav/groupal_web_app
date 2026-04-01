"use client";

import Image from "next/image";
import {
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  ArrowRight,
} from "lucide-react";

const LINKS = {
  company:  ["About", "How It Works", "For Sellers", "Careers", "Press"],
  support:  ["FAQ", "Contact", "Help Center", "Refund Policy", "Safety"],
  legal:    ["Privacy Policy", "Terms of Service", "Cookie Policy"],
} as const;

const SOCIAL = [
  { icon: Twitter,   label: "Twitter"   },
  { icon: Instagram, label: "Instagram" },
  { icon: Facebook,  label: "Facebook"  },
  { icon: Youtube,   label: "YouTube"   },
] as const;

export function Footer() {
  return (
    <footer
      className="bg-groupal-navy text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Seller CTA band ────────────────────────────── */}
      <div
        className="border-b border-white/10"
        style={{ backgroundColor: "#0a3a7a" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-white/80">
            Are you a seller?{" "}
            <span className="font-bold text-white">List your products and reach thousands of buyers.</span>
          </p>
          <a
            href="#"
            className="flex-shrink-0 flex items-center gap-1.5 font-bold text-sm rounded-xl px-5 py-2.5 transition-all duration-200 cursor-pointer"
            style={{ backgroundColor: "#eaad00", color: "#002356" }}
          >
            List your products
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* ── Main footer ────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <a href="/" className="flex items-center gap-2">
              <div className="relative h-9 w-9">
                <Image
                  src="/brand/ICONO AMARILLO.png"
                  alt="Groupal"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <span className="font-heading font-extrabold text-xl">
                <span className="text-white">grou</span>
                <span style={{ color: "#eaad00" }}>pal</span>
              </span>
            </a>
            <p className="text-sm text-white/60 leading-relaxed max-w-[18rem]">
              Buy Together. Save Massive. Join group buys on big-ticket items
              and unlock discounts up to 70%.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors duration-150 cursor-pointer"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-white/50 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {LINKS.company.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-white/70 hover:text-white transition-colors duration-150 cursor-pointer"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-white/50 mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              {LINKS.support.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-white/70 hover:text-white transition-colors duration-150 cursor-pointer"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-white/50 mb-4">
              Get Deal Alerts
            </h4>
            <p className="text-xs text-white/60 mb-3 leading-relaxed">
              Be first to know when new group buys go live.
            </p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="you@email.com"
                className="h-10 rounded-xl bg-white/10 text-white placeholder-white/30 px-3 text-sm outline-none ring-1 ring-white/20 focus:ring-groupal-gold transition-all"
                aria-label="Email for deal alerts"
              />
              <button
                type="submit"
                className="h-10 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer"
                style={{ backgroundColor: "#eaad00", color: "#002356" }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Groupal. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {LINKS.legal.map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
