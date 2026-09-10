import { PackageCheck } from "lucide-react"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"

export default function SellerDealDetailPage() {
  return (
    <SellerComingSoon
      icon={PackageCheck}
      title="Deal Detail"
      description="Buyer progress, milestones, and edit/cancel controls for a single deal are coming in the next phase."
    />
  )
}
