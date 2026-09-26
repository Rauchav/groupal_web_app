import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/deals(.*)",
  "/checkout(.*)",
  // Next.js's file-convention image routes (app/(buyers)/opengraph-image.tsx
  // and friends) — these get a random per-build hash suffix in their URL
  // (e.g. /opengraph-image-1lx01b) that "/" alone doesn't cover, since it's
  // an exact match, not a prefix. Without this, every external crawler
  // (Facebook/Instagram/WhatsApp's shared scraper, LinkedIn, Twitter/X, all
  // of which fetch signed-out) gets redirected to /sign-in instead of the
  // actual image — no error, just silently no preview image anywhere.
  "/opengraph-image(.*)",
  "/twitter-image(.*)",
  "/icon(.*)",
  "/apple-icon(.*)",
  "/how-it-works",
  "/terms",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sellers",
  "/sellers/docs",
  "/api/webhooks(.*)",
  "/api/v1(.*)",
  // GET is intentionally public here (deal browsing — home page, /deals,
  // checkout's Review Deal step, all reachable signed-out); POST/DELETE
  // on these routes already do their own requireUser()/ownership checks
  // server-side, so gating the whole prefix at the route-handler level
  // instead of in middleware is deliberate, not a hole.
  "/api/deals(.*)",
  // The global "recent reviews" feed (buyers/components/marketplace/
  // BuyerReviews.tsx, on the home page) — public, same reasoning as
  // deal browsing above.
  "/api/reviews(.*)",
  // No real job scheduler yet (see app/api/jobs/sweep) — every buyer/
  // seller page load triggers this sweep regardless of whether anyone's
  // signed in, same as deal browsing. It's not user-scoped (no
  // requireUser() call in the route itself), so there's nothing to
  // protect here.
  "/api/jobs/sweep",
  // City-autocomplete lookup (sellers/components/CityAutocomplete.tsx) —
  // a stateless geocoding proxy with no user-specific data, same reasoning
  // as the public routes above.
  "/api/geocode(.*)",
])

const isSellerRoute = createRouteMatcher(["/sellers/dashboard(.*)"])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // Without an explicit target, auth.protect() falls back to Clerk's
    // hosted Account Portal (an unstyled, off-brand page) rather than our
    // own /sign-in — this runs server-side in middleware, so it can't pick
    // up the signInUrl configured on <ClerkProvider> for client components.
    // Seller routes get their own gate (/sellers) rather than the buyer
    // /sign-in, since a seller signing in there also needs the company
    // onboarding check /sellers itself performs.
    const signInPath = isSellerRoute(request) ? "/sellers" : "/sign-in"
    await auth.protect({
      unauthenticatedUrl: new URL(
        `${signInPath}?redirect_url=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`,
        request.url
      ).toString(),
    })
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
