import type { Config } from "tailwindcss";

// ─────────────────────────────────────────────────────────────────────────────
// GROUPAL DESIGN SYSTEM — Tailwind Configuration
//
// BRAND PALETTE (never deviate from these):
//   Navy   #002356  — primary dark, page sections, navy backgrounds
//   Blue   #1b4487  — secondary buttons (default state), status tags bg
//   Gold   #eaad00  — accents, highlights, milestone 1, zone 1 bar, CTA text on dark
//   Orange #e86300  — CTA buttons (hover/active), milestone 2, zone 2 bar, status tag dots
//   Red    #DA1200  — best discount zone (zone 3 bar), active deal badge bg, errors, warnings
//   Green  #048943  — success, confirmed deals, completed badges, CheckCircle2 fill
//   White  #ffffff  — page backgrounds, text on dark surfaces
//
// TYPOGRAPHY:
//   Headings → font-heading (Nunito, extrabold/bold)
//   Body     → font-body / default (Inter, regular/medium)
//   Numbers  → add tabular-nums for prices, timers, counters
//
// BUTTON RULES:
//   Join Group Buy → bg-[#1b4487] default, bg-[#e86300] hover/active
//   Primary CTA    → bg-groupal-green (Button variant="default")
//   Gold CTA       → bg-groupal-gold text-groupal-navy (Button variant="gold")
//   Outline        → border-white text-white (on dark bg)
//
// CARD RULES:
//   Active DealCard     → rounded-2xl, shadow-card, bg-white
//   Completed DealCard  → same shell + navy section + green/navy footer
//   Both cards lift     → whileHover y:-4 (Framer Motion)
//
// DISCOUNT BADGE RULES:
//   Active deal badge    → bg-[#DA1200] text-white with Zap icon (top-left)
//   Completed deal badge → bg-[#048943] text-white, NO Zap icon (top-left)
//
// STATUS TAG RULES (on deal images):
//   Background → #1b4487 | Text → white | Dot → #EC0000
//   Tags shown: "Almost Full" (≥80% buyers) | "Ending Soon" (<24h left)
//
// PROGRESS BAR ZONE COLORS (GroupalPricing):
//   Zone 1 (gold)   → #eaad00  — 0% to milestone 1 buyer count
//   Zone 2 (orange) → #e86300  — milestone 1 to milestone 2
//   Zone 3 (red)    → #DA1200  — milestone 2 to max buyers (best discount)
//
// GROOOPAL PRICE HEADING:
//   <span class="text-white">groo</span>
//   <span style="color:#eaad00">pal</span>
//   <span class="text-white"> price</span>
//
// SECTION BACKGROUNDS:
//   Hero             → bg-groupal-navy (via HeroCarousel)
//   Live Deals       → bg-[#f8fafc]
//   How It Works     → bg-white (with navy full-width banner header)
//   Categories       → bg-groupal-navy
//   Success Cases    → bg-white
//   Stats            → bg-groupal-navy
//   Footer           → bg-groupal-navy
// ─────────────────────────────────────────────────────────────────────────────

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Official Groupal Brand Palette ─────────────────────────
        "groupal-navy":   "#002356",  // primary dark — strokes, dark sections
        "groupal-blue":   "#1b4487",  // secondary — inactive buttons, status tags bg
        "groupal-white":  "#ffffff",  // clean backgrounds
        "groupal-gold":   "#eaad00",  // accent — badges, highlights, milestone 1
        "groupal-orange": "#e86300",  // CTA active — hover/active buttons, milestone 2
        "groupal-red":    "#DA1200",  // danger — errors, warnings, milestone 3
        "groupal-green":  "#048943",  // success — confirmed deals, completed states
        // ── Semantic aliases (map to brand) ────────────────────────
        "groupal-cta":      "#e86300",  // always use for primary CTA hover/active
        "groupal-accent":   "#eaad00",  // always use for highlights and accents
        "groupal-success":  "#048943",  // always use for positive/confirmed states
        "groupal-danger":   "#DA1200",  // always use for errors/warnings
        // ── shadcn/ui tokens (mapped to brand) ─────────────────────
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        // Nunito — headings, product names, prices, bold UI labels
        heading: ["Nunito", "var(--font-nunito)", "sans-serif"],
        // Inter — body copy, descriptions, navigation, metadata
        body:    ["Inter", "var(--font-inter)", "sans-serif"],
        mono:    ["var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        // Section headings use clamp() inline — these are for component-level
        "2xs": ["0.55rem", { lineHeight: "1rem" }],   // micro labels (STEP, PRICED PAYED)
        "3xs": ["0.60rem", { lineHeight: "1rem" }],   // savings callout, buyer counts
      },
      borderRadius: {
        lg:    "var(--radius)",
        md:    "calc(var(--radius) - 2px)",
        sm:    "calc(var(--radius) - 4px)",
        "2xl": "1rem",    // cards, modals
        "3xl": "1.5rem",  // large containers
        "4xl": "2rem",    // hero elements
      },
      boxShadow: {
        // Card resting state — subtle navy-tinted shadow
        card:       "0 2px 8px 0 rgba(0,35,86,0.08), 0 0 0 1px rgba(0,35,86,0.04)",
        // Card hover state — deeper lift
        "card-hover":"0 8px 32px 0 rgba(0,35,86,0.16), 0 0 0 1px rgba(0,35,86,0.06)",
        // Gold glow — focus rings, highlighted elements
        gold:       "0 0 0 3px rgba(234,173,0,0.3)",
        // Navy glow — search bar focus, form inputs
        navy:       "0 0 0 2px rgba(0,35,86,0.25)",
      },
      animation: {
        "pulse-dot":      "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "progress-fill":  "progressFill 1.2s ease-out forwards",
        "float-up":       "floatUp 0.6s ease-out forwards",
        "fade-in":        "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        progressFill: {
          "0%":   { width: "0%" },
          "100%": { width: "var(--progress-width)" },
        },
        floatUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      spacing: {
        // Named spacing for consistency across components
        "section-y":  "5rem",    // py-20 — standard section vertical padding
        "section-y-lg": "6rem",  // py-24 — hero/featured section padding
      },
      maxWidth: {
        // All content containers use max-w-7xl (80rem / 1280px)
        content: "80rem",
      },
    },
  },
  plugins: [],
};

export default config;
