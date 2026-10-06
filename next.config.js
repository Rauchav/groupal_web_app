/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Vercel's build-time file tracer (@vercel/nft) didn't pick up
    // public/fonts/Nunito-ExtraBold.ttf for app/(buyers)/checkout/[dealId]/
    // opengraph-image.tsx — a dynamic route, computed per-request as a real
    // serverless function — even though the font is read via the exact
    // same fs.readFileSync call (lib/og/nunito-font.ts) the homepage's
    // opengraph-image.tsx uses successfully. That one never hit this bug
    // only because it has no dynamic params, so Next.js pre-renders it
    // ONCE at build time (real local filesystem, not a deployed function)
    // and serves the cached result afterward — confirmed via a prod
    // ENOENT: ...open '/var/task/public/fonts/Nunito-ExtraBold.ttf'
    // thrown only by the dynamic deal route. Explicitly including the font
    // directory here is the documented fix for an under-traced file.
    outputFileTracingIncludes: {
      "/**": ["./public/fonts/**/*"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      // Sellers paste an arbitrary product image URL when creating a group
      // buy offer (app/sellers/dashboard/deals/new) — this app has no image
      // upload/hosting yet, so any HTTPS host has to be allowed for that
      // image to actually render on both the seller and buyer sides.
      // Revisit once seller image uploads exist for real.
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
