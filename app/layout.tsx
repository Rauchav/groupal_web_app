import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Groupal — Buy Together. Save Massive.",
  description:
    "Join group buys on big-ticket items and unlock discounts of up to 70%. Electronics, cars, vacations, furniture and more.",
  keywords: ["group buying", "group deals", "cooperative buying", "discounts", "marketplace"],
  openGraph: {
    title: "Groupal — Buy Together. Save Massive.",
    description: "Join group buys and unlock discounts up to 70% on electronics, cars, travel and more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
