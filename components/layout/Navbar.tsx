"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, Menu, X, ShoppingBag, Heart, Bell, Settings, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLikesStore } from "@/lib/stores/likes-store";

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
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const likedCount = useLikesStore((s) => s.likedDealIds.length);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            {isSignedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-full bg-groupal-gold flex items-center justify-center text-groupal-navy font-bold text-xs flex-shrink-0 overflow-hidden">
                    {user?.imageUrl
                      ? <Image src={user.imageUrl} alt="avatar" width={28} height={28} className="object-cover" />
                      : (user?.firstName?.[0] ?? "U")}
                  </div>
                  <span className="text-sm font-semibold max-w-[80px] truncate">
                    {user?.firstName ?? "Account"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      {[
                        { href: "/dashboard",           icon: ShoppingBag, label: "My Group Buys" },
                        { href: "/dashboard/liked",     icon: Heart,        label: "Liked Deals",    badge: likedCount > 0 ? likedCount : undefined },
                        { href: "/dashboard/notifications", icon: Bell,     label: "Notifications" },
                        { href: "/dashboard/settings",  icon: Settings,     label: "Settings" },
                      ].map(({ href, icon: Icon, label, badge }) => (
                        <a
                          key={href}
                          href={href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="flex-1">{label}</span>
                          {badge !== undefined && (
                            <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                              {badge}
                            </span>
                          )}
                        </a>
                      ))}
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut(); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 flex-shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Button variant="ghost-white" size="sm">
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="bg-groupal-green hover:bg-[#059c4f] text-white font-bold rounded-xl"
                >
                  Join Now
                </Button>
              </>
            )}
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
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden border-t border-white/10 bg-groupal-navy px-4 pb-4 space-y-3 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
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
              <Button variant="ghost-white" size="sm" className="flex-1">
                Sign In
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-groupal-green hover:bg-[#059c4f] text-white font-bold"
              >
                Join Now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
