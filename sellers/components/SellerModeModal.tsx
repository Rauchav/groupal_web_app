"use client"

import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { ShieldAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// Shown by the global SellerViewOnlyGuard (sellers/components/
// SellerViewOnlyGuard.tsx) whenever a signed-in seller — has a company
// profile, see sellers/stores/seller-store.ts — clicks anywhere on the buyer
// marketplace. Sellers can look at how their own deals, and competitors',
// appear to real buyers, but this mock model doesn't let one signed-in
// identity actually transact as both at once, so every click here pops
// this instead of performing the real action. Same red-shield icon and
// overlay treatment as the two other buyer/seller cross-registration
// blocks — app/sellers/page.tsx's SellersGatePage ("this account is already
// a buyer", shown when a buyer tries to register as a seller) and
// buyers/components/auth/AlreadySellerBlock.tsx (shown on the buyer
// /sign-in and /sign-up pages when a seller account authenticates there) —
// kept visually consistent even though, unlike those two, this one still
// lets the seller freely browse right up until the click.
export function SellerModeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const { signOut } = useClerk()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[#002356]/60 backdrop-blur-sm"
        className="sm:max-w-sm px-8 py-8"
      >
        <DialogHeader className="items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#DA1200" }}>
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="font-heading font-bold text-[#002356] text-xl">
            This account is already a seller
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            This email address or Google account is already registered as a Groupal seller. You&apos;re welcome to
            keep browsing to see how Groupal deals look from a buyer&apos;s side — to actually join or like one,
            sign out and sign back in with a different email address or Google account.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col space-y-2.5 sm:flex-col sm:space-x-0">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full py-3 rounded-xl font-bold text-white text-sm cursor-pointer transition-colors"
            style={{ backgroundColor: "#002356" }}
          >
            Sign out
          </button>
          <button
            onClick={() => router.push("/sellers/dashboard")}
            className="w-full py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors"
            style={{ color: "#002356" }}
          >
            Go back to my seller account
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
