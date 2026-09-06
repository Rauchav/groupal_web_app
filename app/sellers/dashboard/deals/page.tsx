import { PackageCheck } from "lucide-react"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"

export default function SellerActiveDealsPage() {
  return (
    <SellerComingSoon
      icon={PackageCheck}
      title="Active Offers"
      description="Your live group buy offers will show up here, with real-time buyer progress. Coming in the next phase."
    />
  )
}
