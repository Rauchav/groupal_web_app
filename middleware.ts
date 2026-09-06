import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/deals(.*)",
  "/checkout(.*)",
  "/how-it-works",
  "/terms",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sellers",
  "/sellers/docs",
  "/api/webhooks(.*)",
  "/api/v1(.*)",
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
