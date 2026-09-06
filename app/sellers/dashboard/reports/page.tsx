import { BarChart3 } from "lucide-react"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"

export default function SellerReportsPage() {
  return (
    <SellerComingSoon
      icon={BarChart3}
      title="Reports"
      description="Buyers, offers, and revenue charts — filterable by date and city — are coming in a later phase."
    />
  )
}
