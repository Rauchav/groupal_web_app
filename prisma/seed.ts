// Turns the 8 hardcoded MOCK_DEALS (lib/mock/deals.ts) into real rows —
// the literal step that starts retiring the "hardcoded mockup" problem.
// Idempotent (upserts throughout), same "safe to run repeatedly" property
// as lib/payments/sync-deal-closures.ts's closeExpiredDeals().
//
// COMPLETED_DEALS (lib/mock/deals.ts) is deliberately NOT seeded here —
// it's cosmetic homepage fixture data in a different, simpler shape (no
// milestones, no delivery/pickup, not joinable), not part of the core
// deal catalog this phase is about.
//
// Each of the 8 seed deals' seller only ever existed as a placeholder
// string ("seller-001", no real Clerk account behind it — see Deal's own
// comment in lib/types/deal.ts) — this script creates one real User +
// SellerProfile per fictional storefront so every Deal row has a genuine
// foreign key to point at, the same way a seller created through the real
// onboarding flow would.
import { PrismaClient, type Prisma } from "../lib/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { MOCK_DEALS } from "../lib/mock/deals"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL })
const prisma = new PrismaClient({ adapter })

// Seller-level facts the mock Deal objects never carried (SellerProfile.
// category/city/phone are required columns) — plausible placeholders,
// not meaningful data; nothing in the app reads them for these accounts
// today.
const SELLER_META: Record<string, { category: string; city: string; phone: string }> = {
  "seller-001": { category: "Electronics", city: "Seoul",     phone: "+82 2 1234 5678" },
  "seller-002": { category: "Computers",    city: "Austin",   phone: "+1 512 555 0102" },
  "seller-003": { category: "Motors",  city: "Milan",    phone: "+39 02 5550 1234" },
  "seller-004": { category: "Travels",       city: "La Paz",   phone: "+591 2 244 1122" },
  "seller-005": { category: "Smartphones",  city: "Shenzhen", phone: "+86 755 5550 1122" },
  "seller-006": { category: "Electronics",  city: "Tokyo",    phone: "+81 3 5550 1234" },
  "seller-007": { category: "Home",         city: "London",   phone: "+44 20 7946 0958" },
  "seller-008": { category: "Electronics",      city: "Zurich",   phone: "+41 44 555 0123" },
}

async function main() {
  console.log(`Seeding ${MOCK_DEALS.length} catalog deals...`)

  for (const deal of MOCK_DEALS) {
    const meta = SELLER_META[deal.sellerId] ?? { category: deal.category, city: "Unknown", phone: "" }

    const user = await prisma.user.upsert({
      where: { clerkId: `seed_${deal.sellerId}` },
      update: {},
      create: {
        clerkId: `seed_${deal.sellerId}`,
        email: `${deal.sellerId}@seed.groupal.internal`,
        role: "SELLER",
      },
    })

    const seller = await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: deal.sellerName,
        category: meta.category,
        city: meta.city,
        phone: meta.phone,
        verified: deal.sellerVerified,
      },
    })

    await prisma.deal.upsert({
      where: { id: deal.id },
      update: {},
      create: {
        id: deal.id,
        sellerId: seller.id,
        productName: deal.productName,
        productDescription: deal.productDescription,
        productImages: deal.productImages,
        category: deal.category,
        originalPrice: deal.originalPrice,
        currency: deal.currency ?? "USD",
        maxDiscountPercent: deal.maxDiscountPercent,
        maxBuyersRequired: deal.maxBuyersRequired,
        currentBuyerCount: deal.currentBuyerCount,
        deadlineAt: deal.deadlineAt,
        deliveryType: deal.isPickup ? "PICKUP" : "DELIVERY",
        pickupDetails: deal.pickupDetails as Prisma.InputJsonValue | undefined,
        status: deal.status.toUpperCase() as "ACTIVE" | "COMPLETED" | "CANCELLED",
        createdAt: deal.createdAt,
      },
    })

    // Recreated unconditionally on every run (not nested in the upsert's
    // create-only block, which would silently leave a re-seeded deal with
    // zero milestones the second time this script runs) — pure derived
    // data (lib/mock/deals.ts's milestones() function), never edited after
    // a deal is created, so there's nothing to lose by replacing them.
    await prisma.dealMilestone.deleteMany({ where: { dealId: deal.id } })
    await prisma.dealMilestone.createMany({
      data: deal.milestones.map((m) => ({
        dealId: deal.id,
        buyerCount: m.buyerCount,
        discountPercent: m.discountPercent,
        label: m.label,
      })),
    })

    console.log(`  ✓ ${deal.productName} (${deal.sellerName})`)
  }

  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
