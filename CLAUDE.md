# Groupal — Project Master Brief

## What is Groupal
Groupal is a dual-sided cooperative buying marketplace for
high-value products and services: electronics, cars, motorcycles,
computers, cell phones, technology, furniture, flight tickets,
vacation packages, and more.

## Core Buying Logic — LINEAR PROGRESSIVE DISCOUNT SYSTEM

### The Fundamental Mechanic
Every buyer who joins a group buy adds an equal share of
discount to the entire group. The discount grows linearly
and continuously — not in fixed steps or tiers.

### Discount Formula
discount_per_buyer = max_discount_% / max_buyers_required
current_discount   = buyers_joined × discount_per_buyer
current_group_price = original_price × (1 - current_discount)

### Deal Always Completes
- The deal ALWAYS closes — either at the deadline OR when the
  group reaches max buyer capacity, whichever comes first
- No cancellations, no failure state for buyers
- The only variable is HOW MUCH discount the group earned

### Refunds
Only issued if a SELLER cancels a deal.
Never issued because "not enough buyers joined."

## CRITICAL PAYMENT LOGIC — DO NOT GET THIS WRONG

### The reservation is based on STORE PRICE (fixed), never the group price
The 10% upfront reservation is calculated from the ORIGINAL STORE
PRICE — never from the current/fluctuating group price. This amount
NEVER changes once a buyer starts checkout, regardless of how many
more buyers join afterward.

### Buyers pay ONLY the reservation — no platform fee
The Groupal platform fee is NOT charged to buyers, at checkout or
at any other point. Buyers only ever pay: the 10% reservation at
checkout, and the remaining balance at deal close.

### Correct formulas
RESERVATION PAYMENT (paid when joining — FIXED, never varies):
  reservationAmount  = originalPrice × 10%
  totalDueAtCheckout = reservationAmount

FINAL PAYMENT (paid when deal closes — VARIABLE, shrinks as group grows):
  earnedDiscount   = originalPrice × currentDiscountPercent%
  remainingAmount  = (originalPrice × 90%) - earnedDiscount
  finalTotal       = remainingAmount + deliveryCost

### The platform fee is a SELLER-side cost, not a buyer-side one
Groupal charges SELLERS a percentage fee on each item sold through
the marketplace — this is Groupal's revenue model, not a buyer
charge. It is deducted from the seller's payout when a deal
completes and funds are disbursed:
  sellerPlatformFee = originalPrice × platformFeePercent%
  sellerPayout      = totalCollectedFromBuyers - sellerPlatformFee
This fee is never collected from buyers and never shown in any
buyer-facing total, receipt, or order summary.

### Rules that must never be broken
- NEVER calculate the reservation from currentPrice or groupPrice —
  always from originalPrice (store price)
- NEVER charge or display the platform fee to buyers — it is a
  seller-side cost only
- NEVER show messaging suggesting the reservation amount "may vary"
  or "may change while more buyers join" — it does not, ever
- Only the FINAL payment amount varies, because the discount grows
- This is implemented in lib/utils/deal-calculator.ts — treat that
  file's computeDealValues() function as the single source of truth

### If a final payment fails
- Buyer gets a grace period (a few days) to update their payment
  method or add funds
- Gentle reminder notifications sent during the grace period
- If payment still fails after the grace period: reservation is
  forfeited (not refunded), and the buyer's spot is released
- Communicate this to users in warm, friendly, non-punitive language

## Brand Identity

### Platform Name
Groupal
### Tagline
"Buy Together. Save Massive."

### Brand Colors
--groupal-navy:    #002356  (dark blue — primary backgrounds)
--groupal-blue:    #1b4487  (medium blue — cards, sections)
--groupal-white:   #ffffff  (clean white backgrounds)
--groupal-gold:    #eaad00  (primary accent — badges, highlights)
--groupal-orange:  #e86300  (secondary accent — urgency, timers)
--groupal-green:   #048943  (success — submit, confirm, allowed)
--groupal-red:     #DA1200  (warnings/errors/"ending soon" ONLY —
                              never used for discount levels)
--groupal-gray:    #6B7A99  (neutral — low discount progress state)

### Discount Progress Color Scale (based on % of buyers toward max)
< 25% progress   → gray   #6B7A99
25–50% progress  → gold   #eaad00
50–75% progress  → orange #e86300
75–100% progress → green  #048943
Red is reserved exclusively for warnings, errors, and "Ending Soon"
countdown badges — never for discount tiers.

### Logo Assets (in /public/brand/)
- logo-blue-bg.png     → white+yellow logo on navy background
- logo-white-bg.png    → navy+yellow logo on white background
- logo-full-blue.png   → full logo blue version
- logo-full-white.png  → full logo white version
- icon-yellow.png      → golden shopping bag icon only
- icon-blue.png        → blue shopping bag icon only

### Design Personality
Clean, fresh, modern, friendly, easy, and safe.
Trustworthy as a bank, fun and social as a deals app.
NOT corporate. NOT cold. Warm confidence.
Light mode primary — navy sections for hero/footer/CTAs.

### Typography
- Headings: Nunito (rounded, bold, friendly)
- Body: Inter (clean, readable)
- Prices: tabular figures, prominent, bold

## Tech Stack
- Frontend: Next.js 14 (App Router), TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Database: PostgreSQL via Supabase + Prisma ORM
- Auth: Clerk (Apple + Google sign-in enabled, GitHub disabled)
- Payments: Stripe Connect — NOT YET CONFIGURED (user is relocating
  from Bolivia to Germany end of May 2026; Stripe unavailable in
  Bolivia). Using MOCK payment flow until then. Mock payment logic
  lives in checkout components and lib/stores/participation-store.ts
- State: Zustand (with persist middleware for likes/participations)
- Forms: React Hook Form + Zod
- API Client: TanStack Query
- Email: Resend + React Email
- Job Queues: BullMQ + Upstash Redis
- Analytics: PostHog
- Error tracking: Sentry
- Animations: Framer Motion
- Icons: Lucide React
- Hosting: Vercel (deployed at groupal-web-app.vercel.app)
- Repo: https://github.com/Rauchav/groupal_web_app (public)
- Local project path: /Users/raulchavezvaldiviavelarde/deploy-projects/groupal_web_app/

## Two User Roles

### BUYERS (Final Customers)
- Browse active group buy deals
- See live current price updating as buyers join
- Like/save deals (heart icon — see Buyer Features section below)
- Join deals by paying a FIXED 10% reservation only — no platform
  fee (based on store price, never the group price)
- Share deals socially — every recruit drops the group's final price
- Track deal progress and countdown to deadline
- Pay remaining balance at deal close (90% of store price minus
  earned group discount, plus delivery)

### SELLERS (Companies)
- Register and connect inventory via API (future milestone)
- Create group buy deals: product, original price, max discount %,
  max buyers, deadline, milestones, delivery type/cost, region
- View real-time buyer progress per deal
- Receive payouts after deal completion (via Stripe Connect,
  once configured), minus Groupal's platform fee (see CRITICAL
  PAYMENT LOGIC section above — this fee is seller-side only)

## Buyer Features — Likes / Saved Deals

### Heart Button on Deal Cards
Every deal card has a heart icon button with this class:
"flex h-8 w-8 items-center justify-center rounded-full
bg-white/80 backdrop-blur-sm text-gray-400
hover:text-red-500 hover:bg-white transition-colors
duration-150 shadow-sm cursor-pointer"
Located over the product image, next to the share button.

### Like Behavior
- Logged-in users can click the heart to like/save a deal
- Heart turns red and filled when a deal is liked
- Heart is gray/outline when not liked
- Clicking again unlikes/removes from saved list
- Guest users clicking heart → prompted to sign in

### Liked Deals Storage
- Liked deals saved to database (UserLikedDeal model in Prisma schema)
- Also cached in Zustand store (lib/stores/likes-store.ts) for
  instant UI response, persisted across sessions

### Accessing Liked Deals
- Accessible via the authenticated user navbar menu
- Menu items order:
  1. My Group Buys (current and past purchases)
  2. Liked Deals (saved/favorited deals)
  3. Notifications (with unread count badge)
  4. Settings (payment methods, profile, preferences)
  5. Sign Out
- Route: /dashboard/liked

## Current Development Status (update this section each session)

### Completed
- Full project scaffolding, dependencies, brand config, Prisma schema
- Providers: ClerkProvider, TanStack Query, Sonner toaster
- Buyer homepage (hero, live deals grid, how-it-works strip,
  categories, stats banner, completed deals, footer)
- Deals browse page (/deals) — search, category filters, sort,
  ending-soon banner, skeleton loading
- Deal detail page (/deals/[id]) — full discount breakdown,
  countdown, milestone table, similar deals
- Like/save deals system (heart button, Zustand store, DB model,
  /dashboard/liked page)
- How-it-works page — full educational content, 4-step journey,
  discount mechanic table, "two ways a deal ends" section,
  friendly payment/grace-period explanation, FAQ accordion
- Buyer checkout flow (3 steps: review → delivery → mock payment),
  success page with confetti/share
- Buyer dashboard, purchases page, settings page (profile,
  payment methods placeholder, notification toggles)
- Sign-in/sign-up pages styled with Groupal branding,
  Apple + Google only (GitHub disabled in Clerk dashboard)
- Fixed double Navbar/Footer bug (root layout already renders
  them globally — pages must not import their own)
- Fixed critical payment calculation bug (see CRITICAL PAYMENT
  LOGIC section above)
- Fixed platform-fee bug: buyers were being charged a Groupal
  platform fee at checkout — corrected so buyers pay ONLY the 10%
  reservation, and the platform fee is now modeled as a seller-side
  cost deducted from payouts at deal close (computeDealValues()
  returns sellerPlatformFeeAmount, not a buyer-facing fee)
- Removed the standalone deal detail page (/deals/[id]) — it
  duplicated the checkout page and added an unnecessary click.
  "Join Group Buy" now goes straight to /checkout/[dealId], whose
  Review Deal step (step 1 of 3) is the single pre-purchase deal
  info + pricing page. All deal-card links, share links, and
  related-deal links across the app now point to /checkout/[id]
  instead of /deals/[id]. Redesigned that step's navy pricing card:
  regular store price vs current Groupal price header, a "right now
  vs if the group reaches max" savings comparison, and a simplified
  "Reserve your spot" / "When the deal closes" breakdown that shows
  the unknown final discount as "?%" and a happy-icon graphic
  (public/brand/happy-icon.svg) instead of a computed number, to
  build anticipation rather than front-loading every derived figure

### Not yet built
- Seller Portal (landing, dashboard, deal creator, deal monitoring,
  settings, API docs page) — NEXT MILESTONE
- Real Stripe Connect integration (deferred to Germany move, ~May 2026)
- Real API routes backed by Prisma/Supabase (currently using
  mock data from lib/mock/deals.ts)
- Notification/email system (React Email templates, BullMQ jobs)
- Seller inventory sync API
- Testing (Playwright E2E) and security audit
- Production polish and launch prep

## Development Workflow Notes
- Building via sequential, scoped Claude Code prompts — one
  feature/milestone at a time, test after each before moving on
- Do NOT touch working files (e.g. app/page.tsx, existing
  components) unless a prompt explicitly says to
- Always use @/* import aliases, never relative imports
- All new files must be TypeScript (.ts/.tsx)
- After any prompt that changes business logic or brand rules,
  update THIS FILE (CLAUDE.md) using an append or a full rewrite
  like this one — never let it silently lose content again
