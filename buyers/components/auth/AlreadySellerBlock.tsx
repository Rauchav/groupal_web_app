"use client"

import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { ShieldAlert } from "lucide-react"

// Shown in place of the <SignIn>/<SignUp> widget on the buyer portal's own
// sign-in and sign-up pages (app/(buyers)/sign-in, app/(buyers)/sign-up) the
// moment Clerk resolves the attempted account to one that's already
// registered as a Groupal seller (sellers/stores/seller-store.ts). This is
// the buyer-side mirror of app/sellers/page.tsx's "This account is already
// a buyer" block — deliberately signing in/up as a buyer through this form
// with a seller account is a harder line than the read-only "Buyers Portal"
// browsing a seller can already do once signed in (sellers/components/
// SellerViewOnlyGuard.tsx's click-intercept modal): that mode is reached
// from an already-authenticated seller session and stays view-only, while
// actually completing the buyer sign-in/sign-up FORM with a seller account
// gets stopped here instead of quietly succeeding into that mode.
export function AlreadySellerBlock() {
  const router = useRouter()
  const { signOut } = useClerk()

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#DA1200" }}>
        <ShieldAlert className="h-6 w-6 text-white" />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-heading font-bold text-[#002356] text-xl">This account is already a seller</h1>
        <p className="text-gray-500 text-sm">
          This email address or Google account is already registered as a Groupal seller, so it can&apos;t sign
          in or sign up as a buyer here. Please sign out and use a different email address or Google account to
          create or access a buyer account.
        </p>
      </div>
      <div className="space-y-2.5">
        {/* data-seller-view-ok: this whole page is still, technically, a
            buyer route, so sellers/components/SellerViewOnlyGuard.tsx's
            capture-phase click listener is mounted here too — without this
            opt-out, a click on either button below would be swallowed and
            show its own SellerModeModal instead of actually running. */}
        <button
          data-seller-view-ok
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="w-full py-3 rounded-xl font-bold text-white text-sm cursor-pointer transition-colors"
          style={{ backgroundColor: "#002356" }}
        >
          Sign out
        </button>
        <button
          data-seller-view-ok
          onClick={() => router.push("/sellers/dashboard")}
          className="w-full py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors"
          style={{ color: "#002356" }}
        >
          Go back to my seller account
        </button>
      </div>
    </div>
  )
}
