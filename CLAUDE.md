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

### The two-charge flow — full lifecycle
Implemented in lib/payments/ (reservation-service.ts, gateway.ts,
constants.ts) and lib/jobs/ (card-health-check-job.ts,
deal-close-job.ts, scheduler.ts), against the mock persistence layer
in lib/mock/payments-db.ts (mirrors the Prisma GroupBuyParticipation /
Payment / Notification models field-for-field so it's a drop-in swap
for real Prisma calls later — see file header comments). The mock
Stripe gateway (lib/payments/gateway.ts) is the only module to swap
for real Stripe off-session PaymentIntents; the mock scheduler
(lib/jobs/scheduler.ts) is the only module to swap for real BullMQ
jobs. Every payment attempt — reservation, each final-charge attempt,
each retry — creates its own Payment row for a full audit trail.

1. **Reservation charge (checkout, today):** chargeReservation()
   mock-charges 10% of originalPrice off-session, saves a reusable
   mock payment-method reference on the participation
   (paymentMethodRef), sets status → RESERVATION_PAID, creates a
   Payment row (type RESERVATION), and a DEAL_JOINED notification.

2. **Card health-check job:** runs 4–5 days before a deal's
   deadlineAt (HEALTH_CHECK_WINDOW_DAYS), for every participation
   still at RESERVATION_PAID on that deal. Simulates a lightweight
   validity check on the saved payment method. On failure it sends a
   PAYMENT_REMINDER notification asking the buyer to update their
   card — this step is purely proactive and NEVER changes status.

3. **Deal-close job:** triggers once, when deadlineAt is reached OR
   currentBuyerCount hits maxBuyersRequired (whichever first —
   isDealReadyToClose()). For each RESERVATION_PAID participation:
   computes finalPrice via computeDealValues() (remainingAmount minus
   the earned discount, plus delivery — no platform fee), sets status
   → AWAITING_FINAL_PAYMENT, then attempts the final off-session
   charge.
   - **On success:** status → FINAL_PAYMENT_PAID, creates a Payment
     row (type FINAL_PAYMENT), a PAYMENT_SUCCESS notification, and
     hands off to fulfillment (triggerFulfillment() — stubbed until
     the fulfillment pipeline exists).
   - **On failure:** status → IN_GRACE_PERIOD. Grace period is
     DEFAULT_GRACE_PERIOD_DAYS = 3 days by default, or
     HIGH_TICKET_GRACE_PERIOD_DAYS = 5 days for deals with
     originalPrice ≥ HIGH_TICKET_PRICE_THRESHOLD (currently $1500) —
     see lib/payments/constants.ts. The chosen value is snapshotted
     onto the participation (gracePeriodDays, graceDeadline) so a
     later change to the constants never alters an in-flight grace
     period. Sends one warm, non-punitive PAYMENT_FAILED
     notification immediately.
   - **Auto-retries:** the final charge is retried automatically at
     day 1 and day 2 of the grace period
     (GRACE_PERIOD_RETRY_OFFSETS_DAYS). Each failed auto-retry sends
     one PAYMENT_REMINDER notification with a link to update the
     payment method and trigger an immediate manual retry
     (manualRetryFinalCharge()) — a successful manual retry needs no
     extra notification since the buyer is already on that page. Any
     successful retry (auto or manual) resolves the same as a normal
     success above.
   - **End of grace period, still unresolved:** status → FORFEITED.
     The reservation is kept, NOT refunded. The spot is released back
     to the group (POST /api/jobs/sweep decrements the deal's live
     buyer count directly). Buyer gets one final, kind
     RESERVATION_FORFEITED notification explaining what happened.
     This is the ONLY way a buyer loses their reservation — never
     because "not enough buyers joined."
- Always communicate every step of this to users in warm, friendly,
  non-punitive language — never threatening, never implying fault.

## Category System & Deal-Creation Guardrails

Finalized 2026-09-19. The category list and the hard/soft guardrail
STRUCTURE below are meant to stay stable; the actual numbers (discount
ranges, duration ranges, buyer-count ranges, commission brackets) are a
first pass and are EXPECTED to change once real market research comes
in. That's exactly why every one of these numbers lives in exactly two
files — `lib/constants/category-rules.ts` and `lib/constants/
commission-schedule.ts` — and nowhere else. Retuning a number later
should never require touching the create-deal form, the API route, or
`deal-calculator.ts` — only one of those two constants files.

### Categories

The marketplace's fixed category list (`lib/constants/categories.ts`,
`DEAL_CATEGORIES`) is: **Electronics, Motors, Computers, Smartphones,
Home, Health, Fashion, Leisure, Sports, Travels** (plus "All" as a
buyer-side filter-only option, not a real category any deal or seller
profile can be tagged with). Every category picker in the app — the
Navbar's chips, the /deals filter bar, the homepage's "Shop by
Category" tiles, seller onboarding's primary category, and the
create-deal form's Category field — reads from this one array. The
homepage's category tiles route straight to `/deals?category=<label>`
with no alias translation needed, since every tile label is already a
real category name.

### Per-category deal-creation rules

`lib/constants/category-rules.ts` — one `CategoryRule` per category:
`minDiscountPercent`/`maxDiscountPercent` (the seller's allowed max-
discount range), `recommendedMinDiscountPercent` (advisory only — see
"Two-tier validation" below), `minDurationDays`/`maxDurationDays`, and
`minBuyersRequired`/`maxBuyersRequired`. Current values (first pass,
expected to change):

| Category    | Discount %  | Rec. min | Days  | Buyers |
|-------------|-------------|----------|-------|--------|
| Electronics | 5–40        | 15       | 3–21  | 10–50  |
| Motors      | 5–25        | 12       | 3–30  | 5–20   |
| Computers   | 5–35        | 15       | 3–30  | 5–20   |
| Smartphones | 5–30        | 12       | 3–21  | 5–20   |
| Home        | 10–55       | 20       | 3–14  | 10–50  |
| Health      | 10–60       | 20       | 3–21  | 10–20  |
| Fashion     | 15–65       | 25       | 3–14  | 10–50  |
| Leisure     | 15–35       | 20       | 3–21  | 10–50  |
| Sports      | 10–45       | 18       | 3–14  | 10–50  |
| Travels     | 5–15        | 8        | 3–21  | 10–50  |

A module-load guard in category-rules.ts throws if `DEAL_CATEGORIES`
ever gains a category without a matching rule, so an incomplete retune
fails immediately (a missing-tab build error) instead of silently
letting hard validation no-op for that one category.

### Two-tier validation (hard block vs. soft tooltip)

Every deal-creation surface enforces the SAME two tiers, and the
pattern itself — not just today's numbers — is meant to be permanent:

1. **Hard limits — blocking.** Once a category is picked, max discount,
   deal duration, and max buyers must fall within that category's
   min/max. Enforced in TWO places, both reading `getCategoryRule()`
   from the same constants file so they can never drift apart:
   - Client-side: the create-deal form's zod schema
     (app/sellers/dashboard/deals/new/page.tsx) via a `superRefine`
     that looks up the rule for whatever category is currently
     selected and pushes a field-specific error
     ("{Category} deals must offer between X% and Y% max discount",
     etc.) if a value is out of range. Live range hints ("5–40% for
     Electronics") render under each of the three fields regardless of
     error state, so a seller sees the bounds before typing, not just
     after failing.
   - Server-side: POST /api/deals (app/api/deals/route.ts) runs the
     identical check in its own `superRefine`, independent of the
     client. **Never trust the client-side copy alone** — a request
     built by hand, or a future non-form caller (e.g. the not-yet-built
     seller inventory sync API), must not be able to publish outside a
     category's bounds just because it skipped the browser form.
2. **Soft guidance — advisory only, never blocking.** If the chosen
   discount is within the hard range but below that category's
   `recommendedMinDiscountPercent`, a dismissible, warm-toned tooltip
   appears near the discount field ("We strongly recommend at least
   15% for Electronics deals to attract buyers — you can still publish
   at 10% if you prefer.") — `RecommendedDiscountTooltip` in the
   create-deal form. It never adds a zod issue and never blocks
   `handleSubmit`; dismissing it, or just ignoring it and publishing
   anyway, always works. Re-appears if the seller changes category or
   discount after dismissing, so a dismissal for one combination
   doesn't silently suppress the same warning for a different one.

### Commission schedule

`lib/constants/commission-schedule.ts` replaced the old flat 1.5%
`SELLER_PLATFORM_FEE_PERCENT` in `lib/utils/deal-calculator.ts`.
Groupal's commission now tapers down as a deal's store price climbs,
via `getCommissionPercentForPrice(originalPrice)`:

| Store price bracket | Commission range |
|----------------------|-------------------|
| $1 – $100             | 12% → 8%          |
| $100 – $1,000          | 8% → 5%           |
| $1,000 – $10,000        | 5% → 3%           |
| $10,000 – $100,000       | 3% → 1.5%         |
| $100,000 – $500,000      | 1.5% → 0.5%       |

Within a bracket the percentage interpolates **log-linearly** —
a straight line against log(price), not against price itself — so the
decline reads as smooth per order of magnitude rather than front-
loaded at the bracket's low end. Every bracket's `endPercent` equals
the next bracket's `startPercent` exactly, on purpose, so the curve is
continuous at every boundary (verified: no jump at $100/$1,000/$10,000/
$100,000). Prices below $1 clamp to 12%; prices above $500,000 clamp to
0.5% — no extrapolation past the schedule's ends.
`computeDealValues()` (lib/utils/deal-calculator.ts) calls this for
`sellerPlatformFeeAmount` — still seller-side only, still never shown
to or charged to buyers, per the CRITICAL PAYMENT LOGIC section above.

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
- Database: PostgreSQL via Supabase + Prisma 7 ORM (real, connected —
  see 2026-09-14 entry below; connection URLs live in prisma.config.ts,
  not schema.prisma's datasource block, and the generated client needs
  an explicit @prisma/adapter-pg driver adapter, both new in Prisma 7)
- Auth: Clerk (Apple + Google sign-in enabled, GitHub disabled)
- Payments: Stripe Connect — NOT YET CONFIGURED (user is relocating
  from Bolivia to Germany end of May 2026; Stripe unavailable in
  Bolivia). The gateway is mocked (lib/payments/gateway.ts — simulated
  charge/payout success rates), but persistence is real: Participation/
  Payment/Notification rows live in Postgres via the API routes under
  app/api/deals/[id]/join, app/api/participations/, app/api/jobs/sweep
  (see CLAUDE.md's 2026-09-18 "Un-Mocking phase 5" entry)
- State: Zustand — mostly thin fetch-once caches over the real API now
  (buyers/stores/participation-store.ts, likes-store.ts, lib/notifications/
  notifications-store.ts, lib/dashboard/badges-store.ts), not persisted
  to localStorage; sellers/stores/seller-store.ts (profile) and
  seller-deals-store.ts (legacy, see "Not yet built") still are
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
- Full two-charge payment mechanic (see CRITICAL PAYMENT LOGIC → "The
  two-charge flow" above): reservation charge wired into checkout
  (lib/payments/reservation-service.ts), card health-check job, and
  deal-close job with grace-period auto-retries and forfeiture
  (lib/jobs/). All built as isolated, swappable mock modules — mock
  Stripe gateway (lib/payments/gateway.ts) and mock scheduler
  (lib/jobs/scheduler.ts) — against a mock persistence layer
  (lib/mock/payments-db.ts) shaped exactly like the Prisma
  GroupBuyParticipation/Payment/Notification models, so swapping in
  real Stripe + BullMQ + Prisma later touches only those three files.
  Rewrote the checkout warning copy to explain the full flow (today's
  charge, the automatic final charge, grace period, and forfeiture)
  in warm, non-punitive language. Added paymentMethodRef,
  gracePeriodDays, graceDeadline, and retryAttempts fields to
  GroupBuyParticipation in prisma/schema.prisma to support it.
- Truly separated the buyer and seller portals into distinct folder
  trees, fixing both a structural complaint (seller code was being
  built inside buyer-labeled files/folders) and a real bug (switching
  Google accounts in the same browser could strand a brand-new buyer
  identity inside the seller experience with no way back). All buyer
  routes now live under the route group app/(buyers)/ (URLs unchanged:
  /, /deals, /checkout/[dealId], /dashboard, /sign-in, /sign-up,
  /how-it-works, /terms), each with its own layout
  (app/(buyers)/layout.tsx) rendering the buyer Navbar/Footer/
  SellerViewOnlyGuard. The seller portal (app/sellers/**) has its own
  layout (app/sellers/layout.tsx) and its own standalone
  components/sellers/SellerNavbar.tsx — no shared component branches
  on pathname to serve both portals anymore. Root app/layout.tsx is
  now minimal (ClerkProvider + fonts + Providers/Toaster only), with
  zero portal-specific UI. Moved SellerViewOnlyGuard.tsx and
  SellerModeModal.tsx out of components/marketplace/ (buyer-named)
  into components/sellers/. Fixed the actual bug: rewrote
  lib/stores/seller-store.ts to key seller profiles by Clerk user ID
  (profilesByUserId map + useSellerProfile(userId) hook) instead of
  storing one global unscoped profile in localStorage — every call
  site (app/sellers/page.tsx, app/sellers/dashboard/**,
  SellerViewOnlyGuard, SellerNavbar) now reads the current signed-in
  user's own profile, so a different Google account in the same
  browser is correctly treated as a fresh buyer instead of inheriting
  someone else's seller identity. Known related limitation, not yet
  fixed: participation-store.ts, likes-store.ts, and reviews-store.ts
  have this same not-scoped-to-user-id pattern on the buyer side.
- Moved every buyer- and seller-specific component and Zustand store out
  of the shared components/ and lib/stores/ folders into two dedicated
  top-level trees: buyers/ (components/{layout,marketplace,dashboard}/
  and stores/ — Navbar, Footer, DealCard, CompletedDealCard,
  CountdownTimer, HeroCarousel, LikeButton, StarRating, BuyerReviews,
  DashboardNav, DealPaymentSummary, ReviewModal, and the likes/
  participation/reviews/preferences stores) and sellers/ (components/
  and stores/ — SellerNavbar, SellerDashboardNav, SellerViewOnlyGuard,
  SellerModeModal, SellerComingSoon, and the seller store). components/
  now holds only components/ui/ (shadcn primitives) and providers.tsx —
  genuinely shared across both portals — and lib/ holds only shared
  business logic (types, utils, deal-calculator, mock data, payments,
  jobs, constants, supabase). app/(buyers)/** and app/sellers/** still
  hold only route files (page.tsx/layout.tsx), as required by Next.js —
  those didn't move, only their imports were repointed at the new
  locations. Every @/* import updated repo-wide (~30 files); no runtime
  behavior, styling, or text changed. Verified via `npx tsc --noEmit`
  and a full route smoke test (/, /deals, /checkout/[dealId], /sellers,
  /sellers/dashboard, /dashboard all resolve exactly as before).
- Manual deal creation loop hardened, and three create-offer gaps closed
  ahead of the eventual database migration (schema now settled for these):
  - Deal.productImage (single string) → Deal.productImages (string[],
    1–6, first = cover). The create-offer form
    (app/sellers/dashboard/deals/new/page.tsx) now collects a required
    cover photo plus up to 5 optional additional photos via a
    useFieldArray list, each with its own live preview; every non-empty
    URL is verified to actually load an image before publish is allowed
    (not just URL-shaped — a page link like an Unsplash photo page, not
    the direct image file, is rejected). The checkout page's gallery
    (app/(buyers)/checkout/[dealId]/page.tsx) — main image, clickable
    thumbnails, mobile slider — was already fully built but fed a
    3x-repeated single image; it now renders the real array.
  - New Deal.deliveryZones?: { label, price }[] (1–4, manual for now —
    e.g. Downtown $10 / Midtown $15 / Suburbs $20) — replaces the
    flat-everywhere $9.99 delivery charge for deals that define zones
    (seed deals have none yet, so they keep behaving exactly as before
    via a fallback at every read site). The create-offer form collects
    zones when "Delivered" is selected (cleared automatically if the
    seller switches to Pickup, so no stale zone data lingers). At
    checkout, the buyer picks one of the deal's zones on the Delivery
    step; that zone's price becomes the deliveryCost passed to
    chargeReservation() — the real payment engine
    (lib/payments/reservation-service.ts, lib/jobs/deal-close-job.ts) was
    already built to store and later re-read a per-participation
    deliveryCost, it just never had a variable one to use before now.
    Threaded the same value through to the simple client-side store
    (buyers/stores/participation-store.ts's MockParticipation gained a
    deliveryCost field) so the dashboard's payment summary
    (buyers/components/dashboard/DealPaymentSummary.tsx) reflects the
    buyer's actual picked rate instead of also hardcoding $9.99.
  - New shared components/success-celebration.tsx (confetti +
    animated-checkmark modal, extracted from the buyer checkout-success
    page, which now just supplies its own copy) — a seller landing on
    the new app/sellers/dashboard/deals/published page after publishing
    an offer gets the same celebratory treatment, with a "See it live"
    CTA straight to the real /checkout/[dealId] page a buyer would see.
  - Verified live end-to-end: created an offer with 2 photos and 3
    delivery zones, confirmed the success screen, the real gallery and
    "Delivery: from $10.00" on the checkout page, and the Active Offers
    list — all matching what was entered in the form.
- (2026-09-09) Two small UX refinements on top of the multi-image/
  delivery-zones work above:
  - Unseen-deal count badge on the seller "Active Offers" nav link
    (sellers/components/SellerDashboardNav.tsx). New deal counts are
    tracked per-seller in sellers/stores/seller-deals-store.ts
    (lastViewedCounts map + markDealsViewed()); the badge shows
    deals.length - lastViewedCounts[sellerId] in Groupal orange
    (#e86300, not red — CLAUDE.md reserves red for warnings/errors/
    "ending soon" only) and clears the moment the seller opens
    app/sellers/dashboard/deals/page.tsx (calls markDealsViewed() on
    mount). Verified live: publishing a new offer shows the badge
    immediately on the sidebar/mobile-tabs nav, right on the success
    screen the seller lands on after publishing.
  - Checkout Delivery Details step no longer shows each delivery
    zone's price up front — app/(buyers)/checkout/[dealId]/page.tsx's
    StepDelivery zone picker is now a single stacked column (radio-dot
    selector, zone label only, no price), so the buyer picks their
    area without anchoring on a number yet. The price now surfaces one
    step later, in StepConfirm's actual payment breakdown: a "Delivery
    ({zone label})" line sits between "Reservation (10%)" and "Total
    due today," with a small note underneath clarifying delivery is
    charged with the final payment, not today (it's never added into
    "Total due today," which stays reservation-only per the payment
    logic above). The redundant zone+price line that used to live
    under the delivery address was trimmed to just the zone label,
    since the price now has its proper home in the breakdown.
- (2026-09-09) "Closed Deals" unseen-count badge, plus a full "offer" →
  "deal" terminology pass across the whole seller portal:
  - The Closed Deals nav link (previously a "Coming in the next phase"
    placeholder) is now a real list: app/sellers/dashboard/deals/closed/
    page.tsx renders every one of the signed-in seller's deals whose
    status is "completed" (final price, final discount %, and buyers
    joined out of max), reusing computeDealValues() the same way the
    Active Deals list does. Getting deals to actually close from inside
    the seller portal needed a real fix, not just a badge: MOCK_DEALS
    (lib/mock/deals.ts) is an in-memory module array that resets to just
    the 8 seed deals on every fresh page load, and closeExpiredDeals()
    (lib/payments/sync-deal-closures.ts) only ever mutates deal objects
    it finds inside that array. A seller's own created deals only rejoin
    MOCK_DEALS by object reference through sellers/components/
    SellerNavbar.tsx (mounted for the whole /sellers/** tree) — mirroring
    exactly what SellerViewOnlyGuard.tsx already does for the buyer side
    — re-pushing this seller's persisted deals via addMockDeal() BEFORE
    running closeExpiredDeals(), so the mutation lands on the same object
    the seller-deals-store still holds, then closeExpiredDeals() runs and
    bumps the shared useMockDealsSyncStore tick so Active/Closed Deals and
    their nav badges (sellers/stores/seller-deals-store.ts) recompute.
    Without that re-link step, a seller would never see their own deals
    close unless a buyer happened to load a buyer-side page first.
  - Unseen-count badge (same orange #e86300 mechanic as the existing
    Active Deals badge) added to the Closed Deals nav link in both
    SellerDashboardNav.tsx and SellerNavbar.tsx's account menu: tracked
    via lastViewedClosedCounts/markClosedDealsViewed/
    useUnseenClosedDealsCount in seller-deals-store.ts, clearing the
    moment the seller opens the Closed Deals page. Verified live: forced
    a just-created deal's deadline into the past, reloaded, and watched
    Active Deals drop from 2→1 while Closed Deals picked up a "1" badge
    that cleared on opening the page and stayed cleared on a second
    reload.
  - Renamed "offer(s)" → "deal(s)" everywhere a seller sees the word,
    across app/sellers/**, sellers/components/SellerNavbar.tsx, and
    sellers/components/SellerDashboardNav.tsx — nav labels ("Active
    Offers"/"Closed Offers" → "Active Deals"/"Closed Deals"), buttons
    ("New Offer" → "New Deal", "Publish Group Buy Offer" → "Publish
    Group Buy Deal"), headings, empty-state copy, stat card labels, and
    placeholder text, so buyers and sellers alike consistently see
    "group buy deal" as the one name for what a seller creates. Left
    alone: the buyer portal (already used "deal" everywhere — this was
    purely a seller-portal inconsistency), the verb "offer" in the
    how-it-works FAQ ("unable to offer cancellations" — different sense
    of the word), and internal code comments (not user-facing).
- (2026-09-09) New-seller onboarding now ends on the same celebration
  screen as a deal publish or a buyer's checkout success, instead of a
  toast + immediate redirect: app/sellers/page.tsx's OnboardingStep
  renders the shared components/success-celebration.tsx after
  createProfile() succeeds ("Welcome to Groupal — the best way to sell
  fast and sell massive!" / "Start creating deals: the more you launch
  with great discounts, the faster you'll move your inventory." / "Let's
  Get Started" → straight to /sellers/dashboard/deals/new, so a new
  seller lands on the create-deal form rather than an empty dashboard).
  Fixed a real race this surfaced: SellersGatePage's own "already
  onboarded" redirect effect fires the instant useSellerProfile(userId)
  goes truthy, which happens immediately after createProfile() — without
  a guard this yanked the seller to /sellers/dashboard before the
  celebration ever painted. Added a justOnboarded flag (lifted to
  SellersGatePage, set via an onOnboarded callback passed into
  OnboardingStep) that both the redirect effect and the page's loading
  gate now check, so an already-onboarded seller still gets redirected
  on a normal visit, but a freshly-onboarded one sees the celebration
  first. Verified live end-to-end: fresh onboarding submit → celebration
  renders and stays put (no flash-redirect) → "Let's Get Started" lands
  on Create a Group Buy Deal.
- (2026-09-10) Unseen-count badges on the buyer dashboard nav
  (buyers/components/dashboard/DashboardNav.tsx), matching the seller
  portal's Active/Closed Deals badges — same orange #e86300 pill, same
  "unseen since last visit" mechanic, but on three different triggers:
  - "My Group Buys" (buyers/stores/participation-store.ts): badge counts
    participations the buyer hasn't opened that page to see since
    joining — lastViewedGroupBuysCount vs. participations.length,
    cleared by markGroupBuysViewed() on that page's mount. Total
    participations only ever grows (joining always adds one), so this is
    safe to diff against even though a joined deal later leaves the
    "active" list once it closes.
  - "Purchases": badge counts participations that have left "active"
    (status "completed" or "forfeited" — i.e. the deal closed) since the
    buyer last opened that page — lastViewedClosedCount vs. that
    filtered count, cleared by markClosedViewed(). Neither of these two
    counts is scoped per-buyer-id — consistent with participation-store's
    pre-existing, known limitation of not being scoped by user id at all
    (see the buyers/sellers folder-reorg entry above).
  - "Notifications": deliberately NOT an "unseen since last visit" badge
    — it's a live unread count (lib/mock/payments-db.ts's new
    useUnreadNotificationsCount(userId), subscribing directly to the
    reactive paymentsDb store), since NotificationsPage already tracks
    read/unread per item and only flips it on an explicit click or "Mark
    all as read". Simply opening the page must not clear it the way
    visiting the other two pages clears theirs.
  Verified live: joined a deal → "My Group Buys" and "Notifications"
  badges appeared, "My Group Buys" cleared on visiting /dashboard;
  force-flipped a participation to "completed" → "Purchases" badge
  appeared and cleared on visiting /dashboard/purchases; clicked "Mark
  all as read" on Notifications → that badge cleared immediately, live,
  with no page reload needed.
- (2026-09-10) Full buyer↔seller notification suite covering a deal's
  entire lifecycle, from creation through payout. **All notification text
  lives in exactly one file: lib/notifications/copy.ts** — every title/
  message for every notification type is a small function there (e.g.
  dealJoinedCopy, sellerDealCompletedCopy), grouped BUYER then SELLER in
  the order the events actually happen. Edit wording there and it updates
  everywhere that notification fires; no other file hardcodes any
  notification copy. Icons/colors for each type live in the adjacent
  lib/notifications/style.tsx, shared by both the buyer
  (app/(buyers)/dashboard/notifications/page.tsx) and the now-real seller
  (app/sellers/dashboard/notifications/page.tsx — previously a "Coming
  Soon" placeholder) Notifications pages.
  - New NotificationTypes: SELLER_DEAL_PUBLISHED, SELLER_PAYOUT_ISSUE
    (lib/types/payment.ts). Newly WIRED (the types already existed but
    nothing ever created them): DEAL_PROGRESS, DEAL_ENDING_SOON,
    DEAL_COMPLETED, SELLER_NEW_BUYER, SELLER_DEAL_COMPLETED,
    SELLER_PAYOUT_SENT.
  - Lifecycle covered: seller publishes a deal (SELLER_DEAL_PUBLISHED,
    wired in sellers/stores/seller-deals-store.ts's addDeal) → a buyer
    joins, paying the 10% reservation (DEAL_JOINED for that buyer +
    SELLER_NEW_BUYER for the seller, both in
    lib/payments/reservation-service.ts's chargeReservation) → every
    OTHER buyer already in that deal gets nudged that their price just
    dropped (DEAL_PROGRESS, same function) → once a deal enters its
    final 24 hours, everyone still in it gets warned once
    (DEAL_ENDING_SOON — new lib/jobs/deal-ending-soon-job.ts, folded into
    the existing closeExpiredDeals() sweep in
    lib/payments/sync-deal-closures.ts that already runs on every buyer/
    seller page load) → the deal closes: every buyer gets a group-level
    "here's how it went" congratulations with final buyer count/discount/
    savings (DEAL_COMPLETED), independent of their own final-charge
    outcome (which still gets its own existing PAYMENT_SUCCESS/
    PAYMENT_FAILED/PAYMENT_REMINDER/RESERVATION_FORFEITED notification,
    copy now also centralized into lib/notifications/copy.ts) → the
    seller gets one sale summary (SELLER_DEAL_COMPLETED: units sold,
    final discount, gross revenue, Groupal's commission, net payout —
    same currentPrice/sellerPlatformFeeAmount basis as the "Revenue" stat
    card on app/sellers/dashboard/page.tsx) → a new mock payout gateway
    (sendPayout() in lib/payments/gateway.ts, 95% success rate, same
    pattern as the existing chargeOffSession/checkPaymentMethodValidity)
    is attempted once per deal, resulting in either SELLER_PAYOUT_SENT or
    SELLER_PAYOUT_ISSUE ("contact Groupal support," non-alarming tone).
    All of this lives in lib/jobs/deal-close-job.ts's closeDeal() and its
    new settleSellerPayout() helper.
  - Schema: Deal (lib/types/deal.ts) gained sellerUserId (the seller's
    real Clerk id, distinct from sellerId — sellers/stores/seller-store.ts's
    internal "seller_..." profile id — since notifications must be
    targeted by Clerk id) and endingSoonNotified?: boolean (dedupes the
    ending-soon sweep). Seed deals (lib/mock/deals.ts) set sellerUserId
    to the same placeholder as sellerId; app/sellers/dashboard/deals/new/
    page.tsx now sets it to the signed-in user's real id when a seller
    publishes a deal.
  - **Real bug found and fixed while testing this**: mutations directly
    on a seller-created Deal object — currentBuyerCount++, status =
    "completed", endingSoonNotified = true — were never actually written
    back to localStorage. They only survived within one continuous page
    session; the next hard reload silently reverted them (deal.status
    back to "active", buyer count back to 0), which would have made the
    close-sweep re-run closeDeal() and re-send every close/payout
    notification on every subsequent page load. Fixed with a new
    persistSellerDealMutations() export in sellers/stores/
    seller-deals-store.ts (forces zustand's persist middleware to
    re-serialize `deals`, picking up in-place mutations on the shared
    object references), called from chargeReservation(),
    closeExpiredDeals(), and resolveGracePeriodExpiry() right after each
    mutates a Deal. Verified via repeated hard reloads with localStorage
    inspection: buyer count and status now persist correctly, and
    notification counts stay at exactly 1 each no matter how many times
    the sweep re-runs.
  - Verified live end-to-end (two full passes, second one after the
    persistence fix): published a deal → SELLER_DEAL_PUBLISHED fires +
    badge; joined as a buyer → DEAL_JOINED + SELLER_NEW_BUYER fire with
    correct buyer-count/discount figures; force-closed the deal (past
    deadline, real hard reloads in between) → DEAL_COMPLETED,
    PAYMENT_SUCCESS, SELLER_DEAL_COMPLETED, and SELLER_PAYOUT_SENT all
    fired exactly once each, with correct math (e.g. $1000 item, 1
    buyer, 13.3% discount → $866.67 revenue, $15.00 commission, $851.67
    payout) — confirmed both via raw localStorage inspection and the
    rendered seller Notifications page (all icons/copy correct).
    DEAL_PROGRESS (needs a second buyer under a different Clerk
    identity) was verified via code review of the shared
    chargeReservation() code path rather than a live second-account
    click-through.
- (2026-09-11) Real seller-facing deal detail page — was the "Deal
  Detail" SellerComingSoon placeholder at app/sellers/dashboard/deals/[id]/
  page.tsx, now the seller-only counterpart to app/(buyers)/checkout/
  [dealId]/page.tsx's "Review Deal" step (same gallery/store-price/
  groupal-price/milestones/progress-bar/countdown visual language, no
  buyer-only CTA), with a "who's in the group" section replacing the
  reserve-a-spot card: a horizontal overlapping avatar stack + "N buyers
  joined in", click to expand into a full list (avatar, name, city if
  present, amount paid upfront, live-estimated remaining payment if the
  deal closed right now via computeEstimatedFinalPrice, exact join date/
  time). Sellers no longer land on their own deal's BUYER checkout page
  at all — Active Deals cards, Closed Deals cards, the post-publish
  celebration CTA (now "View my deal" instead of "See it live"), and the
  seller Notifications "View deal" links all point here instead.
  - Root cause of the bug that prompted this: app/(buyers)/checkout/
    [dealId]/page.tsx redirects to /dashboard if useParticipationStore's
    (not user-scoped — a known, pre-existing limitation) hasJoined(dealId)
    is true for ANYONE who used this browser, so a seller clicking their
    own deal card landed on the BUYER dashboard, welcomed by their own
    Clerk first name (e.g. "Raul") rather than their seller company name
    (e.g. "Dismac") — same account, two different display identities,
    read as "someone else's dashboard." Moving sellers off that route
    entirely sidesteps it rather than patching the buyer-side redirect.
  - Schema: Participation (lib/types/payment.ts) gained buyerName?/
    buyerAvatarUrl?, captured from Clerk's useUser() at the moment of
    chargeReservation() (lib/payments/reservation-service.ts — new
    required buyerName/optional buyerAvatarUrl params) since this mock
    layer has no way to look up another user's Clerk profile later —
    denormalized onto the participation itself, the same reasoning as
    every other buyer-identity field already stored there.
  - Verified live end-to-end: published a 2-photo deal, joined it as a
    real buyer (captured real Clerk name + avatar + city), confirmed the
    Active Deals card, the post-publish CTA, and a seller-notification
    "View deal" link all land on this new page with correct data (0→1
    buyer, 8% discount, $50 paid upfront, $420 "if closed now" — checked
    against the formula by hand); force-closed the deal and confirmed
    the countdown hides and the status badge flips to "Closed" while the
    buyer list stays intact.
- (2026-09-12) "Share this deal" on the seller deal-detail page
  (app/sellers/dashboard/deals/[id]/page.tsx) — same gold-fill/navy-border/
  navy-text/drop-shadow CTA style as the buyer marketplace cards'
  own share button (buyers/components/dashboard/DealPaymentSummary.tsx's
  CTA_BUTTON_CLASS — duplicated as a local SHARE_BUTTON_CLASS constant on
  the seller page rather than cross-imported, per the buyer/seller
  component-tree separation), placed right after the countdown inside the
  navy pricing card. Opens sellers/components/ShareDealModal.tsx (new),
  with two real, functional social-share buttons (WhatsApp/X — genuine
  wa.me and twitter.com intent links — and Copy Link, genuine clipboard
  write) pointed at the deal's real buyer-facing URL
  (/checkout/{dealId}), plus a "Reach your own customers" section: upload
  a CSV (name/email/phone columns, simple dependency-free parser, no
  quoted-comma support yet), pick SMS/Email/WhatsApp channels, and send.
  That send is explicitly SIMULATED — there's no real Twilio/SendGrid/
  WhatsApp Business API configured (same "not yet built" bucket as real
  Stripe Connect), so it parses the CSV for real and reports a real
  contact count, but never actually messages anyone, and says so both in
  small print under the button and in the success toast ("Simulated: N
  customers would be reached via ..."). Verified live: uploaded a 3-row
  test CSV via the browser's file-input upload path, confirmed "3
  contacts detected", toggled SMS+Email, sent, and got the correct
  simulated-count toast; Copy Link fired a real "Link copied!" toast.
- (2026-09-13) Buyer↔seller exclusive-account enforcement — a signed-in
  Clerk account can now never hold both a buyer and a seller identity,
  enforced everywhere that boundary is crossed:
  - Seller trying to register as a buyer: app/(buyers)/sign-in and
    sign-up now catch this the moment Clerk resolves the account, before
    ever reaching the buyer homepage — new buyers/components/auth/
    AlreadySellerBlock.tsx (red ShieldAlert card, Sign out / Go back to
    my seller account). Needed `forceRedirectUrl` AND
    `signInForceRedirectUrl` on `<SignUp>` (and the mirrored pair on
    `<SignIn>`): Clerk transfers a "sign up with an already-existing
    account" attempt to a SEPARATE sign-in redirect target that
    `forceRedirectUrl` alone doesn't cover — without both, the transfer
    bypassed the check entirely and landed straight on the buyer
    homepage.
  - Buyer trying to register as a seller: app/sellers/page.tsx's
    SellersGatePage blocks via new buyers/stores/buyer-identity-store.ts,
    which now marks a Clerk account "a buyer" the moment it's signed in
    ANYWHERE on the buyer portal without a seller profile (an effect in
    sellers/components/SellerViewOnlyGuard.tsx, mounted on every buyer
    route) — not only on an explicit like/join, which was the original,
    too-narrow definition that let a buyer who "just signed up and did
    nothing else" slip through.
  - Seller browsing the buyer portal ("Buyers Portal" nav link, or
    landing there directly): SellerViewOnlyGuard's capture-phase
    click-intercept + sellers/components/SellerModeModal.tsx restored to
    the original browse-then-intercept UX (an earlier full-block attempt
    broke the "Buyers Portal" feature entirely by preventing browsing at
    all) — restyled to match the other two blocks: red ShieldAlert icon,
    the lighter navy overlay used by the checkout-success celebration,
    Sign out / Go back to my seller account buttons.
  - Real bug found and fixed along the way: DealCard's "Already Joined"
    badge, LikeButton's filled heart, Navbar's liked-count badge, the
    checkout page's already-joined redirect, and the dashboard/purchases/
    liked pages were all reading buyers/stores/participation-store.ts and
    likes-store.ts directly — neither store is scoped by Clerk user id (a
    known, pre-existing limitation), so a seller browsing view-only could
    see a completely different buyer account's real joined/liked state.
    New useIsSeller() hook (sellers/stores/seller-store.ts) now gates
    every one of those reads; the three dashboard pages additionally
    redirect a seller to /sellers/dashboard before ever painting another
    account's data (closing the same gap for direct-URL visits, not just
    clicks).
- (2026-09-13) Deal reach (city/country/continent) + external product
  link — two new fields on Deal (lib/types/deal.ts): `reach?: DealReach`
  (`{ scope: "city"|"country"|"continent", values: string[] }`, captured
  via a scope toggle + multi-value picker in the create-deal form,
  replacing an earlier, narrower single city/country pair this same
  session) and `externalProductUrl?: string` (a deep link to the exact
  product page on the seller's own site — optional for now, a future pass
  makes it required). New shared components/deal-reach-badge.tsx renders
  a scope-appropriate icon (pin/flag/globe) + short label everywhere deal
  info shows up: DealCard, CompletedDealCard, the buyer dashboard's "My
  Group Buys"/"Purchases" cards, checkout's Review Deal step (replacing a
  hardcoded fake "Available in: {Seller} Region" line), and the seller's
  Active/Closed Deals lists and deal-detail page. The "In Store Price"
  button (DealCard and checkout) now opens externalProductUrl first,
  falling back to the seller's general sellerUrl. Not yet wired into any
  actual buyer-side filtering — display-only until the region-matching
  rules themselves are defined (planned as a follow-up).
- (2026-09-13) Seller Sales Reports (app/sellers/dashboard/reports/
  page.tsx) — was a "coming in a later phase" placeholder, now a real
  reporting dashboard: KPI cards (Total/Closed Deals, Buyers Joined,
  Gross Revenue, and a wide navy-background/gold-text Net Payout card
  spanning the two grid slots the removed Groupal Commission card used to
  occupy), Date range/Category/City/Status filters, two hand-drawn charts
  (revenue by month, revenue by category — no charting library added, by
  design, as a base to escalate later), and a deal-by-deal table. City
  filtering currently stands in with the seller's own registered city
  (SellerProfile.city) rather than deal.reach, since the latter isn't
  wired into any filtering yet — see the page's own cityOf() comment.
- (2026-09-13) Seller deal-detail page, closed state (app/sellers/
  dashboard/deals/[id]/page.tsx) — a closed deal now shows "Group buy
  deal closed" where the countdown used to be (previously nothing
  rendered there at all once a deal closed), and "Review my sales
  reports" (BarChart3 icon, links to the Reports page above) in place of
  "Share this deal", which only makes sense for a still-open deal.
- (2026-09-13) Fixed a real bug: a buyer received ~30 duplicate "ending
  soon" notifications for the same deal. Root cause: deal.endingSoonNotified
  (the flag meant to dedupe this) is mutated directly on a SEED deal
  object (lib/mock/deals.ts's MOCK_DEALS — a plain in-memory array with
  no persistence layer, unlike seller-created deals), so it silently
  reset to undefined on every fresh page load, letting lib/jobs/
  deal-ending-soon-job.ts's sweep re-fire indefinitely. Fixed by checking
  paymentsDb's actual persisted notification history per buyer+
  participation (new paymentsDb.hasNotificationForParticipation()) instead
  of relying solely on the in-memory flag — robust regardless of whether
  that flag survives a reload. Known related gap, not fixed here:
  seed-deal mutations in general (buyer counts, closed status) don't
  persist across reloads the way seller-created deals do; the database
  migration below removes this whole class of bug structurally.
- (2026-09-13) Cleanup pass ahead of the database migration: removed
  DealCard's vestigial onJoin/onShare callback props (the card already
  navigates/shares internally regardless of what's passed — one call
  site's onJoin was actually a redundant window.location.href
  hard-navigation duplicating the already-working router.push), removed
  an already-unused Badge import from app/(buyers)/page.tsx, and
  corrected several comments left stale by earlier changes this same
  session (app/sellers/page.tsx's and buyer-identity-store's descriptions
  of what counts as "buyer activity"; SellerModeModal.tsx's list of
  sibling cross-registration blocks; the Reports page's cityOf() note
  about deal.reach not existing, which it now does).
- (2026-09-14) "The Un-Mocking," phases 00–4: Users, SellerProfiles, and
  Deals (+ milestones/deliveryZones/reach) moved off localStorage/
  in-memory MOCK_DEALS onto a real Supabase Postgres database via
  Prisma 7, with full CRUD through real API routes — the deliberate
  scope line drawn for this pass (see "Not yet built" below for what's
  still mock). Provisioned the existing paused-then-resumed Supabase
  project, reconciled prisma/schema.prisma (11 models, 7 enums) against
  it, seeded the 8 catalog deals as real rows (prisma/seed.ts,
  idempotent), then built and wired the data-access layer:
  - lib/db.ts (PrismaClient singleton via PrismaPg adapter), lib/auth/
    current-user.ts (requireUser()/requireClerkId() — lazily creates a
    User row on first authenticated API call if Clerk's webhook hasn't
    already, since local dev has no public HTTPS endpoint for Clerk to
    call), app/api/webhooks/clerk/route.ts (real svix-verified
    user.created/updated/deleted handling, still a no-op if
    CLERK_WEBHOOK_SECRET isn't set).
  - New routes: GET/POST /api/sellers (own profile + onboarding upsert),
    GET/POST /api/deals (list with ?sellerId=/?status= filters; create,
    zod-validated, ownership resolved server-side from the session —
    never trusted from the request body), GET/DELETE /api/deals/[id]
    (single deal; delete is ownership-checked and cascades to
    milestones/deliveryZones/reach/participations/likes/reviews per
    schema.prisma), POST /api/deals/[id]/join (atomic currentBuyerCount
    increment — the one bridge point between the still-mock reservation
    engine and a real Deal row, called right after chargeReservation()
    succeeds in checkout's handleComplete()).
  - lib/api/deal-adapter.ts's apiDealToDeal() converts Prisma's real
    relational wire shape (nested seller, per-row reach values,
    uppercase enums, ISO date strings) into the exact pre-existing Deal
    TypeScript shape every buyer/seller component already consumes —
    this is what made the frontend cutover a rewire instead of a
    rewrite. lib/api/use-fetch.ts's useApiGet() is the small GET hook
    (data/loading/error/refetch, no caching/dedup) every rewired page
    uses.
  - Rewired to real data: the buyer home page and /deals browse page
    (both fetch /api/deals?status=... — work signed-out, same as
    before), checkout's Review Deal step (fetches /api/deals/[id],
    "You might also like" now pulls from real active deals, the join
    bridge above wired into handleComplete()), the seller onboarding
    form, the create-deal form, the Active/Closed Deals lists (real
    fetch + a new working delete button — Trash2 icon, confirm dialog,
    calls DELETE /api/deals/[id] — the "erase a deal" capability that
    didn't exist before today), and the seller deal-detail page.
  - Real bug found and fixed during end-to-end verification: middleware.ts's
    isPublicRoute matcher was never updated when the /api/deals* routes
    were built, so Clerk's auth.protect() was redirecting even the
    intentionally-public GET /api/deals calls to /sign-in — silently
    breaking the signed-out home page, /deals, and checkout's Review Deal
    step (each route handler already does its own per-method auth check,
    e.g. POST/DELETE return 401 without a session, so this was a
    middleware gap, not a missing server-side guard). Fixed by adding
    "/api/deals(.*)" to the public matcher.
  - Verified: npx tsc --noEmit and npx next build both clean; live
    against the real dev server and real Supabase data — GET /api/deals
    returns all 8 seeded deals, the home page/deals page/a checkout page
    all render real DB data (price, discount, buyer count, milestones,
    related deals) with no session, and POST/DELETE on /api/deals both
    correctly return 401 without one. Not verified live in this pass (no
    Clerk test credentials available to this session): the full signed-in
    loop of onboarding a seller, creating a deal through the real form,
    and deleting it via the new button — logically wired and typechecked,
    but wants a real manual click-through.

- (2026-09-18) "The Un-Mocking," phase 5 — the final mock layer: every
  remaining piece the 2026-09-14 pass deliberately deferred
  (Participations, Payments, Notifications, Likes, Reviews, notification
  preferences, and the buyer/seller cross-registration flag) now reads
  from and writes to the real Postgres database. Nothing in the app is
  backed by localStorage/Zustand-persist as its source of truth anymore
  except two small, explicitly out-of-scope legacy pieces noted below.
  - Schema: added `notificationPreferences Json?`,
    `lastViewedGroupBuysCount`/`lastViewedPurchasesCount Int @default(0)`,
    and `hasBuyerActivity Boolean @default(false)` to User (migration
    `20260918171606_user_buyer_side_fields`). Every other model this phase
    needed (GroupBuyParticipation, Payment, Notification, UserLikedDeal,
    Review) already existed from the 2026-09-14 schema reconciliation.
  - New API routes, all under lib/auth/current-user.ts's requireUser()
    pattern except where noted: `GET/PATCH /api/users/me` (role,
    notification preferences, badge snapshots, hasBuyerActivity — lazily
    provisions the User row same as every other route); `GET
    /api/participations` (mine, deal embedded); `POST
    /api/participations/[id]/retry` (buyer-initiated grace-period retry);
    `GET /api/deals/[id]/participants` (seller-only, ownership-checked —
    the "who's in the group" list); `GET /api/notifications`, `PATCH
    /api/notifications/[id]`, `POST /api/notifications/read-all`; `POST
    /api/deals/[id]/like` (toggle) and `GET /api/likes` (dealIds + full
    deals in one call); `GET/POST /api/deals/[id]/reviews` (mine; upsert)
    and `GET /api/reviews` (public, global recent-reviews feed — the
    homepage strip isn't deal-scoped); `GET/POST /api/dashboard/badges`
    (the two "unseen since last visit" snapshot counts, now per-account
    instead of per-browser). `lib/api/deal-include.ts` centralizes the
    Deal `include` shape every one of these (and the existing deals
    routes) shares, plus a `dealRowToApiDeal()` converter for server code
    that wants to reuse `apiDealToDeal()`/`computeDealValues()` directly
    on a fresh Prisma row without an HTTP round trip first.
  - `POST /api/deals/[id]/join` — rewritten from the Phase-4 buyer-count-
    only bridge into the FULL reservation charge: the real-DB counterpart
    of the old lib/payments/reservation-service.ts's chargeReservation().
    Creates the GroupBuyParticipation + Payment(RESERVATION) rows,
    increments the real Deal's currentBuyerCount, and fires all three
    join-time notifications (buyer DEAL_JOINED, seller SELLER_NEW_BUYER,
    every other active participant DEAL_PROGRESS).
  - `POST /api/jobs/sweep` — the real-DB stand-in for a job scheduler (no
    BullMQ/Upstash yet), replacing all four old mock jobs (lib/jobs/
    card-health-check-job.ts, deal-close-job.ts, deal-ending-soon-job.ts,
    scheduler.ts) and lib/payments/sync-deal-closures.ts in one endpoint:
    ending-soon notifications, card health-check reminders, closing deals
    past their deadline/max-buyer-count (final charge attempt → success or
    grace period, seller payout), and grace-period auto-retries/
    forfeiture. The old scheduler's setTimeout-based "retry on day 1/day
    2" became a due-date check instead (days-since-grace-start vs.
    GRACE_PERIOD_RETRY_OFFSETS_DAYS, driven by retryAttempts) — more
    reliable than the mock version's setTimeout, which never survived
    across days in a real browser tab anyway. Deliberately public/
    unauthenticated (not user-scoped) and called from every buyer/seller
    page load (app/(buyers)/page.tsx, app/(buyers)/deals/page.tsx,
    sellers/components/SellerViewOnlyGuard.tsx,
    sellers/components/SellerNavbar.tsx) — added to middleware.ts's public
    matcher alongside GET /api/reviews (same reasoning as GET
    /api/deals — reachable signed-out).
  - Reused unchanged: lib/payments/gateway.ts (mock Stripe-style
    functions), lib/payments/constants.ts (grace-period rules), and
    lib/notifications/copy.ts (all notification text) — all three were
    already pure functions with zero mock-persistence dependency, so the
    real routes call them exactly as the old jobs did.
  - Frontend: kept the same public store interfaces wherever a
    consumer file didn't otherwise need touching, and swapped only the
    internals from localStorage-persisted to an in-memory fetch-once
    cache — buyers/stores/participation-store.ts (now also embeds each
    participation's full Deal, fixing a real latent bug: the dashboard/
    purchases pages used to look a joined deal up via
    `MOCK_DEALS.find(...)`, which would have silently failed to render
    for any deal created through the real seller flow) and buyers/stores/
    likes-store.ts. DealCard.tsx, LikeButton.tsx (minus its now-redundant
    markAsBuyer call), and Navbar.tsx needed zero changes as a result.
    New lib/notifications/notifications-store.ts and lib/dashboard/
    badges-store.ts (shared, deduped fetch caches — several nav badges
    read the same underlying counts) replace lib/mock/payments-db.ts's
    reactive slice. Rewired directly (no store to preserve, the old
    interface didn't fit): checkout's handleComplete (one fetch to the
    rewritten join route replaces chargeReservation + addParticipation +
    the old bridge fetch), the buyer and seller notifications pages, the
    settings page's notification toggles, BuyerReviews.tsx and
    DealPaymentSummary.tsx's review flow, the liked-deals gallery, and the
    seller deal-detail page's buyer list.
  - Real bug found and fixed along the way: POST /api/deals (seller deal
    creation, from the 2026-09-14 pass) never sent the
    SELLER_DEAL_PUBLISHED notification the old mock addDeal() used to —
    lost when deal creation moved off that store and never ported. Fixed
    by creating it inline in the route, right after the Prisma create.
  - Cleanup: deleted lib/mock/payments-db.ts, lib/payments/
    reservation-service.ts, lib/payments/sync-deal-closures.ts, all of
    lib/jobs/, and buyers/stores/{reviews,buyer-identity,preferences}-store.ts
    outright — fully obsolete, not deprecated-in-place. Removed
    sellers/stores/seller-deals-store.ts's addDeal/persistSellerDealMutations/
    useMockDealsSyncStore — already fully dead (nothing has called addDeal
    since deal creation moved to POST /api/deals on 2026-09-14; confirmed
    via a repo-wide grep before deleting) — and the matching MOCK_DEALS-
    sync effects in SellerViewOnlyGuard.tsx/SellerNavbar.tsx, replaced
    with real fetch-based store refreshes and the sweep trigger.
  - Verified: npx tsc --noEmit and npx next build both clean. A dedicated
    Prisma script exercised the real POST /api/jobs/sweep route (over real
    HTTP) against three hand-seeded participations covering deal-close,
    grace-period-retry-due, and forfeiture — all 9 assertions passed
    (correct status transitions, exactly-once Payment/notification
    creation, deal.currentBuyerCount decrementing on forfeit) — then
    cleaned up every test row. Live in the browser against the user's own
    real signed-in account: liking a deal wrote a real UserLikedDeal row
    (confirmed via a direct DB query), showed up correctly on
    /dashboard/liked with live price/discount/milestone data, and
    unliking removed it — full round trip, no console errors. Not
    independently verified live: an actual checkout join (would have
    consumed the user's own test deal's buyer slot) and a manual
    grace-period retry — logically identical Prisma operations to what
    the sweep test already exercised, but this is exactly what the user
    was about to test themselves next.
- (2026-09-18, same day) Closed the seller-side gap the entry above
  flagged, plus every other spot still reading the old mock deal catalog
  instead of the real database — the user asked for this specifically
  ("please pull that data from the database and not the local memory,
  and whatever else is needed"):
  - Schema: added `lastViewedDealsCount`/`lastViewedClosedDealsCount Int
    @default(0)` to SellerProfile (migration
    `20260918180253_seller_badge_counts`) — the seller-side counterpart
    of User's own lastViewed* badge snapshots from the entry above.
  - New `GET/POST /api/sellers/badges` (mirrors `/api/dashboard/badges`
    exactly) and new sellers/stores/seller-badges-store.ts (mirrors
    lib/dashboard/badges-store.ts) — a small fetch-once cache exposing
    `useUnseenDealsCount(userId)`/`useUnseenClosedDealsCount(userId)`,
    same exported names sellers/components/SellerDashboardNav.tsx already
    called, just now keyed by Clerk userId instead of the dead local
    store's fake sellerId and backed by a real count query.
    app/sellers/dashboard/deals/page.tsx and .../closed/page.tsx now call
    `markViewed()` on mount to clear the badge — this had been silently
    dropped when those two pages were rewired to the real API on
    2026-09-14 and never restored until now.
  - app/sellers/dashboard/page.tsx (welcome stats) and .../reports/
    page.tsx (Sales Reports) now fetch the seller's real id via
    GET /api/sellers and its real deals via GET /api/deals?sellerId=,
    same pattern the Active/Closed Deals lists already used — both had
    been silently showing zero/empty since 2026-09-14.
  - Deleted sellers/stores/seller-deals-store.ts outright — every real
    consumer was migrated above, and everything else in it
    (persistSellerDealMutations, useMockDealsSyncStore, addDeal) was
    already unreachable dead code.
  - Found the same "reads the mock catalog, real deals silently don't
    show up" bug in four more places while auditing for it: checkout's
    success page (buyer-facing, showed generic copy with no product name
    for any real deal), the checkout route's generateMetadata (link-
    preview title/description), its opengraph-image (the actual share-
    card image — required switching that route's Next.js runtime from
    "edge" to the default Node.js runtime, since the shared Prisma client
    needs Node's net/tls modules, unavailable on Edge), and the seller's
    own "your deal is live!" post-publish screen. All four now query the
    real deal via Prisma (server components) or GET /api/deals/[id]
    (client component). Removed the now-fully-dead getMockDealById,
    addMockDeal, and releaseDealSpot from lib/mock/deals.ts — confirmed
    via repo-wide grep before deleting each.
  - Deliberately left alone: MOCK_DEALS is still read by app/api/v1/deals/
    route.ts, a placeholder stub for the not-yet-built seller inventory
    sync API — not reachable from any real page today, out of scope here.
  - **User's question, answered and confirmed correct in the same
    conversation, worth keeping as a standing note:** SellerProfile.city
    (the seller's own registered HQ location, set once at onboarding) and
    Deal.reach (city/country/continent, set per-deal at creation — see
    lib/types/deal.ts's own comment) are and must stay two separate
    concepts. The only connection between them is a one-time convenience
    default: the create-deal form (app/sellers/dashboard/deals/new/
    page.tsx) pre-fills the reach picker's first city value with
    `profile.city` when reachScope defaults to "city", since a seller's
    own city is often a reasonable first guess — the seller can freely
    change or clear it, and nothing else ties the two fields together.
    Matching a deal's reach against a BUYER's own location (not the
    seller's) is real future work, not yet wired into any filtering — see
    deal.reach's own comment in lib/types/deal.ts and the Reports page's
    cityOf() note for where that intentionally stands today.
  - Verified: npx tsc --noEmit and npx next build both clean. Confirmed
    correct against real Supabase data via direct queries (the real
    "Dismac" seller profile created during earlier testing has exactly 1
    ACTIVE deal and 0 COMPLETED — matching what the rewired badge/stats/
    reports queries would now compute). Not verified live by clicking
    through the seller dashboard itself: the browser session available
    this session had since switched to a different, buyer-only Clerk
    account (no seller profile, local or real) — wants a real check next
    time the user is signed in as their seller account.
- (2026-09-19) Two small UI fixes, both diagnosed by actually measuring the
  live page rather than guessing from markup:
  - The seller dashboard's Settings page shifted the whole layout (nav
    sidebar included) a few pixels left whenever it was open — first
    diagnosed (wrongly) as a CSS Grid overflow issue in Settings' form
    (fixed with `min-w-0` on its grid cells — a real, separate, harmless
    fix, but not the actual cause). The real cause, found by measuring
    the sidebar's exact pixel position across pages: Settings' content is
    taller than the viewport at typical window sizes and needs a vertical
    scrollbar, while shorter pages (Active Deals, Reports) don't — and a
    scrollbar appearing/disappearing between page loads changes the
    viewport's usable width, so the centered `max-w-[…] mx-auto` shell
    re-centers into a different width and visibly shifts. Fixed app-wide
    (not just Settings) by adding `scrollbar-gutter: stable` to `html` in
    app/globals.css, so the browser always reserves that space regardless
    of whether the current page needs to scroll. Verified by measuring
    the sidebar's `getBoundingClientRect().left` on three pages before/
    after — identical now, whether or not the page has a scrollbar.
  - The seller Sales Reports page's "City" filter (app/sellers/dashboard/
    reports/page.tsx) predated Deal.reach (2026-09-13) and had never been
    reconnected to it — it always grouped every deal under the seller's
    own registered city (`cityOf()`, an explicitly-flagged stand-in),
    never the deal's real per-deal reach. Replaced with a "Reach" filter
    built from the actual union of reach values across the seller's
    deals, grouped by scope (`<optgroup>`: Cities / Countries /
    Continents, since a seller's deals can mix scopes) — matching on any
    value in a deal's `reach.values`. The table's city column is now a
    "Reach" column rendering the same shared components/deal-reach-badge.tsx
    every other deal listing already uses, instead of plain text. Deals
    with no reach set don't contribute a filter option and only show
    under "All locations". Verified live against the real seller's actual
    mixed-scope deals (one city-scoped, one country-scoped with 3
    countries) — the grouped dropdown and the filter-to-one-deal behavior
    both confirmed via direct DOM inspection, not just visual inspection.
- (2026-09-19) Finalized category system, deal-creation guardrails, and
  commission schedule — see the new "Category System & Deal-Creation
  Guardrails" section above for the full table/logic writeup; this entry
  is just the changelog.
  - Replaced `DEAL_CATEGORIES` (Electronics, Cars & Motorcycles,
    Computers, Smartphones, Furniture, Travel, Vacations) with the final
    10: Electronics, Motors, Computers, Smartphones, Home, Health,
    Fashion, Leisure, Sports, Travels. Updated every consumer: lib/mock/
    deals.ts and prisma/seed.ts's category strings remapped to the new
    names (Cars/Motorcycles → Motors, Cell Phones → Smartphones, Travel/
    Vacations → Travels, Gadgets → Electronics, Furniture → Home);
    app/(buyers)/deals/page.tsx's `dealMatchesCategory` alias-map deleted
    entirely (was only ever compensating for the old inconsistent seed
    category strings — a plain equality check is correct now); app/
    (buyers)/page.tsx's homepage "Shop by Category" tiles rebuilt to use
    the 10 real category names directly (5×2 grid), dropping the old
    CATEGORY_HREF alias table since every tile now links straight into
    `/deals?category=<label>` with no translation; app/layout.tsx's meta
    description copy updated. Also directly updated the 8 already-seeded
    Deal/SellerProfile rows already sitting in the real Supabase DB
    (prisma/seed.ts's `upsert` doesn't touch existing rows' fields on a
    re-run, so re-running the seed script alone would NOT have fixed
    already-seeded data) — confirmed via a live query that only the 6
    valid new category names remain in use.
  - New lib/constants/category-rules.ts and lib/constants/
    commission-schedule.ts (see the section above for both tables).
    lib/utils/deal-calculator.ts's flat `SELLER_PLATFORM_FEE_PERCENT`
    constant replaced with `getCommissionPercentForPrice(deal.
    originalPrice)`.
  - Two-tier validation (hard block + soft tooltip) added to the create-
    deal form (client) and mirrored in POST /api/deals (server) — see
    the section above for exactly how the two stay in sync.
  - Verified: npx tsc --noEmit and npx next build both clean. A
    standalone script confirmed the commission curve is continuous at
    every bracket boundary (no jump at $100/$1,000/$10,000/$100,000) and
    correctly clamps below $1 and above $500,000. Live in the browser,
    signed in as the real seller: the three range hints render under
    Discount/Buyers/Days for the selected category; entering 10% (within
    Electronics' 5–40% range but below its 15% recommended minimum)
    showed the exact advisory tooltip copy specified, non-blocking;
    entering 2% (below the 5% hard minimum) blocked submission with
    "Electronics deals must offer between 5% and 40% max discount" and
    correctly cleared once changed back into range. The /deals category
    chips and the homepage tiles were both confirmed routing to the
    correct, already-filtered results.

### Not yet built
- Once real image upload exists (this needs the database/storage in
  place first — there's no upload pipeline yet, only pasted image URLs),
  add a required profile picture step to seller onboarding
  (app/sellers/page.tsx's OnboardingStep / the "Tell us about your
  company" form): registration must NOT be able to complete without one.
  Flagged 2026-09-10.
- Real Stripe Connect integration (deferred to Germany move, ~May 2026)
  — the payment engine above is fully mocked and ready to swap in
  lib/payments/gateway.ts once Connect is configured
- Real job scheduling (BullMQ/Upstash) and email delivery
  (React Email/Resend) — POST /api/jobs/sweep is the sweep-on-page-load
  stand-in for the former; notification content already exists in
  lib/notifications/copy.ts, just not wired to a real email send step yet
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
