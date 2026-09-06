"use client"

import { useRouter } from "next/navigation"
import { Store } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// Shown by the global SellerViewOnlyGuard (components/marketplace/
// SellerViewOnlyGuard.tsx) whenever a signed-in seller — has a company
// profile, see lib/stores/seller-store.ts — clicks anywhere on the buyer
// marketplace. Sellers can look at how their own offers, and competitors',
// appear to real buyers, but this mock model doesn't let one signed-in
// identity actually transact as both at once, so every click here pops
// this instead of performing the real action.
export function SellerModeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[#002356]/95 backdrop-blur-md"
        className="sm:max-w-sm px-11 py-[82px]"
      >
        <DialogHeader className="items-center text-center">
          <div className="flex items-center justify-center gap-2">
            <Store className="h-5 w-5" style={{ color: "#eaad00" }} />
            <DialogTitle style={{fontSize:"20px"}}>You are currently a seller</DialogTitle>
          </div>
          <DialogDescription>
            You&apos;re viewing the buyers portal to see how Groupal Deals look from a buyer&apos;s side, sign out and
            sign back in as a buyer to actually join or like a deal.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="-mx-11 -mb-[82px]">
          <button
            onClick={() => router.push("/sellers/dashboard")}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors duration-150 cursor-pointer"
            style={{ backgroundColor: "#002356" }}
          >
            Go back to my seller account
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
