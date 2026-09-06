import { PackageX } from "lucide-react"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"

export default function SellerClosedDealsPage() {
  return (
    <SellerComingSoon
      icon={PackageX}
      title="Closed Offers"
      description="Offers that hit their buyer target or closing date will land here, with final results. Coming in the next phase."
    />
  )
}
