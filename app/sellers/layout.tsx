import { SellerNavbar } from "@/sellers/components/SellerNavbar"

// Wraps the entire seller portal — the /sellers gate, /sellers/docs, and
// the /sellers/dashboard/** subtree (whose own layout adds the
// auth/onboarding guard and sidebar on top of this). Deliberately its own
// tree: no buyer Navbar/Footer, no shared conditionals with
// app/(buyers)/layout.tsx.
export default function SellersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SellerNavbar />
      {children}
    </>
  )
}
