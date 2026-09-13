// NOTE FOR DEVELOPER: To remove GitHub from social login options,
// go to Clerk Dashboard → User & Authentication → Social Connections
// and disable the GitHub provider there.
// Apple and Google should be the only enabled social providers.

"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SignIn, useUser } from "@clerk/nextjs"
import { useIsSeller } from "@/sellers/stores/seller-store"
import { AlreadySellerBlock } from "@/buyers/components/auth/AlreadySellerBlock"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn } = useUser()
  const isSeller = useIsSeller()

  // forceRedirectUrl below always brings Clerk back to this same page after
  // auth — even over an explicit ?redirect_url= (e.g. LikeButton.tsx
  // sending a signed-out visitor here to sign in before liking a deal) —
  // so a seller account can be caught and shown AlreadySellerBlock right
  // here no matter how this page was reached, before it ever reaches the
  // buyer homepage or wherever it was headed. A genuine buyer just needs to
  // be sent on manually now that Clerk's own redirect stops here first.
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
          // session (isLoaded && !isSignedIn) — mounting this widget while
          // isLoaded is still false risked it discovering an already-valid
          // session (e.g. a seller who never signed out) and running its
          // own "already signed in" redirect internally, straight past the
          // isSeller check above, before this component's state ever caught
          // up. This was the real cause of a seller occasionally reaching
          // the buyer homepage without ever seeing AlreadySellerBlock.
          <SignIn
            forceRedirectUrl="/sign-in"
            // Symmetric case to the fix on the sign-up page: if someone
            // tries to sign IN with a Google account that has no Clerk User
            // yet, Clerk transfers this to a SIGN-UP instead, using the
            // separate signUpForceRedirectUrl prop rather than
            // forceRedirectUrl above. Set for defense-in-depth so that
            // transfer also comes back through this page's own check.
            signUpForceRedirectUrl="/sign-in"
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
