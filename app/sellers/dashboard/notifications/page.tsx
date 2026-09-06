import { Bell } from "lucide-react"
import { SellerComingSoon } from "@/sellers/components/SellerComingSoon"

export default function SellerNotificationsPage() {
  return (
    <SellerComingSoon
      icon={Bell}
      title="Notifications"
      description="Buyer activity and offer-lifecycle alerts will show up here, mirroring the buyer notifications page."
    />
  )
}
