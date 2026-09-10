/** @type {import('next').NextConfig} */
const nextConfig = {
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
