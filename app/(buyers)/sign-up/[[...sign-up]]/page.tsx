// NOTE FOR DEVELOPER: To remove GitHub from social login options,
// go to Clerk Dashboard → User & Authentication → Social Connections
// and disable the GitHub provider there.
// Apple and Google should be the only enabled social providers.

"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SignUp, useUser } from "@clerk/nextjs"
import { useIsSeller } from "@/sellers/stores/seller-store"
import { AlreadySellerBlock } from "@/buyers/components/auth/AlreadySellerBlock"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn } = useUser()
  const isSeller = useIsSeller()

  // Same reasoning as app/(buyers)/sign-in/[[...sign-in]]/page.tsx: forcing
  // the redirect back to this page (over any ?redirect_url=) lets a seller
  // account get caught and shown AlreadySellerBlock here, before ever
  // reaching the buyer homepage or wherever it was headed.
  useEffect(() => {
    if (isSignedIn && !isSeller) router.replace(searchParams.get("redirect_url") || "/")
  }, [isSignedIn, isSeller, router, searchParams])

  return (
    <main className="min-h-screen bg-[#002356] flex items-center justify-center pt-28 pb-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/brand/isologo fondo azul.svg"
            alt="Groupal"
            className="h-16 mx-auto mb-4"
          />
          <p className="font-heading font-bold text-white/70 text-sm">
            Buy together. Save massive.
          </p>
        </div>
        {!isLoaded ? null : isSignedIn && isSeller ? (
          <AlreadySellerBlock />
        ) : isSignedIn ? null : (
          // Only ever mounted once Clerk has confirmed there's no existing
          // session — see app/(buyers)/sign-in/[[...sign-in]]/page.tsx's
          // own comment on this exact same guard for why.
          <SignUp
            forceRedirectUrl="/sign-up"
            // The real bug: signing "up" with a Google account that already
            // has a Clerk User (exactly what a seller account is) makes
            // Clerk internally transfer this to a SIGN-IN instead — and
            // that transfer redirects using signInForceRedirectUrl, a
            // completely separate prop from forceRedirectUrl above (which
            // only fires after a genuinely new sign-up). Without this, that
            // transfer fell through to Clerk's app-wide default redirect
            // (straight to "/"), skipping this page's isSeller check
            // entirely — which is exactly how a seller using "Join Now"
            // reached the buyer homepage with no warning.
            signInForceRedirectUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: "w-full flex justify-center",
                cardBox: "mx-auto",
                card: "shadow-2xl rounded-2xl",
                headerTitle: "text-[#002356] font-bold",
                formButtonPrimary:
                  "bg-[#048943] hover:bg-[#037a3b] text-white",
                footerActionLink: "text-[#002356] hover:text-[#1b4487]",
              },
            }}
          />
        )}
      </div>
    </main>
  )
}
