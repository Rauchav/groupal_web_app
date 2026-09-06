import { Navbar } from "@/buyers/components/layout/Navbar"
import { Footer } from "@/buyers/components/layout/Footer"
import { SellerViewOnlyGuard } from "@/sellers/components/SellerViewOnlyGuard"

// Wraps every buyer-facing route (this whole route group — see the other
// files under app/(buyers)/). The seller portal has its own, separate
// layout at app/sellers/layout.tsx with its own SellerNavbar; nothing here
// is shared with or branches on it.
export default function BuyersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      {/* Renders nothing unless the signed-in visitor is a seller — see
          the component for why that combination needs a guard at all. */}
      <SellerViewOnlyGuard />
    </>
  )
}
