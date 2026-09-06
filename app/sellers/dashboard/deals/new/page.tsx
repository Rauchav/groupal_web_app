import { PlusCircle } from "lucide-react"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"

export default function NewSellerDealPage() {
  return (
    <SellerComingSoon
      icon={PlusCircle}
      title="Create a Group Buy Offer"
      description="The guided offer wizard — product details, fulfillment, and group buy terms — is coming in the next phase."
    />
  )
}
