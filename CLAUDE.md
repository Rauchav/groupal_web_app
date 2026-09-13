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
     to the group (releaseDealSpot() decrements the deal's live
     buyer count). Buyer gets one final, kind RESERVATION_FORFEITED
     notification explaining what happened. This is the ONLY way a
     buyer loses their reservation — never because "not enough
     buyers joined."
- Always communicate every step of this to users in warm, friendly,
  non-punitive language — never threatening, never implying fault.

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

### Not yet built
- Real API routes backed by Prisma/Supabase, replacing every mock data
  source (lib/mock/deals.ts's hardcoded MOCK_DEALS, lib/mock/
  payments-db.ts, sellers/stores/seller-deals-store.ts, and every other
  buyers/stores/*.ts persist store) with one real Postgres database via
  Prisma — THE NEXT MILESTONE, starting 2026-09-14. A full phase-by-phase
  roadmap was written and reviewed on 2026-09-13 (provision Supabase →
  reconcile prisma/schema.prisma → seed the 8 catalog deals as real rows
  → build API routes mirroring today's mock function signatures → cut
  over reads, then seller writes, then participations/likes/
  notifications → delete the mock layer). This migration structurally
  fixes several known bugs/gaps at once: the not-scoped-by-user-id
  limitation on participation-store.ts/likes-store.ts, seed-deal
  mutations not surviving a reload (today's ~30-duplicate-notification
  bug), and the seller-deals-store persistence workarounds
  (persistSellerDealMutations, the SellerNavbar re-link effect,
  useMockDealsSyncStore) — all of which a real database needs none of.
  - Once real image upload exists (this needs the database/storage in
    place first — there's no upload pipeline yet, only pasted image
    URLs), add a required profile picture step to seller onboarding
    (app/sellers/page.tsx's OnboardingStep / the "Tell us about your
    company" form): registration must NOT be able to complete without
    one. Flagged 2026-09-10 — do this as soon as the database
    integration milestone starts, i.e. now.
- Real Stripe Connect integration (deferred to Germany move, ~May 2026)
  — the payment engine above is fully mocked and ready to swap in
  lib/payments/gateway.ts once Connect is configured
- Real job scheduling (BullMQ/Upstash) and email delivery
  (React Email/Resend) — job logic and notification content already
  exist as isolated functions in lib/jobs/, just not wired to a real
  queue or an email send step yet
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
