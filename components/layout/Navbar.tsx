"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Menu, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Electronics",
  "Cars",
  "Motorcycles",
  "Fashion",
  "Technology",
  "Home",
  "Gadgets",
  "Travel",
  "Experiences",
] as const;

export function Navbar() {
  const [scrolled,      setScrolled]      = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [searchFocus,   setSearchFocus]   = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-shadow duration-300",
        "bg-groupal-navy",
        scrolled && "shadow-[0_2px_16px_rgba(0,35,86,0.32)]"
      )}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Main Nav Row ──────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">

          {/* Logo */}
          <a
            href="/"
            className="flex-shrink-0 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-groupal-gold rounded-lg"
            aria-label="Groupal — home"
          >
            <div className="relative h-8 w-8">
              <Image
                src="/brand/ICONO AMARILLO.png"
                alt="Groupal icon"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <span
              className="hidden sm:block font-heading font-extrabold tracking-tight leading-none select-none"
              style={{ fontSize: "1.35rem" }}
            >
              <span className="text-white">grou</span>
              <span style={{ color: "#eaad00" }}>pal</span>
            </span>
          </a>

          {/* Search bar — center */}
          <div className="flex-1 max-w-xl mx-auto">
            <div
              className={cn(
                "relative flex items-center transition-all duration-200",
                searchFocus
                  ? "ring-2 ring-groupal-gold rounded-xl"
                  : "ring-1 ring-white/20 rounded-xl hover:ring-white/40"
              )}
            >
              <Search className="absolute left-3 h-4 w-4 text-white/50 pointer-events-none" />
              <input
                type="search"
                placeholder="Search deals, products, categories..."
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                className={cn(
                  "w-full h-10 rounded-xl bg-white/10 text-white placeholder-white/40",
                  "pl-9 pr-4 text-sm outline-none",
                  "transition-colors duration-150"
                )}
                aria-label="Search deals"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
              Sign In
            </Button>
            <Button
              size="sm"
              className="bg-groupal-green hover:bg-[#059c4f] text-white font-bold"
            >
              Join Now
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="flex sm:hidden items-center justify-center h-10 w-10 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* ── Category chips ─────────────────────────────── */}
        <div className="hidden md:flex justify-center items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer",
                activeCategory === cat
                  ? "bg-groupal-gold text-groupal-navy shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-groupal-navy px-4 pb-4 space-y-3">
          {/* Mobile search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="search"
              placeholder="Search deals..."
              className="w-full h-10 rounded-xl bg-white/10 text-white placeholder-white/40 pl-9 pr-4 text-sm outline-none ring-1 ring-white/20 focus:ring-groupal-gold transition-all"
              aria-label="Search deals"
            />
          </div>
          {/* Mobile categories */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setMobileOpen(false); }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  activeCategory === cat
                    ? "bg-groupal-gold text-groupal-navy"
                    : "text-white/70 hover:text-white bg-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Mobile CTA buttons */}
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" size="sm" className="flex-1 text-white/80">
              Sign In
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-groupal-green hover:bg-[#059c4f] text-white font-bold"
            >
              Join Now
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
