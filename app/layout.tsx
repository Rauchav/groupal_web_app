import type { Metadata } from "next"
import "./globals.css"
import { Inter, Nunito } from "next/font/google"
import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/sonner"
import Providers from "@/components/providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const nunito = Nunito({ subsets: ["latin"], variable: "--font-display" })

export const metadata: Metadata = {
  // So shared links (e.g. a /checkout/[dealId] deal card resharing itself)
  // resolve their og:image to an absolute, correct-domain URL instead of
  // Next.js guessing one — required for WhatsApp/iMessage/etc. previews to
  // actually load the image rather than silently failing.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://groupal-web-app.vercel.app"),
  title: "Groupal — Buy Together. Save Massive.",
  description:
    "Join group buys on big-ticket items and unlock discounts of up to 70%. Electronics, cars, vacations, furniture and more.",
  keywords: [
    "group buying",
    "group deals",
    "cooperative buying",
    "discounts",
    "marketplace",
  ],
  openGraph: {
    title: "Groupal — Buy Together. Save Massive.",
    description:
      "Join group buys and unlock discounts up to 70% on electronics, cars, travel and more.",
    type: "website",
  },
}

// Deliberately minimal — no portal-specific UI here. The buyer chrome
// (Navbar/Footer/seller-view-only guard) lives in app/(buyers)/layout.tsx
// and the seller chrome (SellerNavbar) lives in app/sellers/layout.tsx.
// Next.js only allows one root layout, so this is just the shared shell
// (fonts, ClerkProvider, toaster) both portals sit inside.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html
        lang="en"
        className={cn("font-sans", inter.variable, nunito.variable)}
      >
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
