import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
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
            <Navbar />
            {children}
            <Footer />
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
