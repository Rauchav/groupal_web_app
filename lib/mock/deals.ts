import { Deal, DiscountMilestone } from "@/lib/types/deal";

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

function daysFromNow(d: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date;
}

// Generates 3 milestone markers at 25%, 50%, and 100% of maxBuyers
function milestones(maxBuyers: number, maxDiscount: number): DiscountMilestone[] {
  const dpb = maxDiscount / maxBuyers;
  const at = (pct: number, label: string): DiscountMilestone => {
    const count = Math.round(maxBuyers * pct);
    return { buyerCount: count, discountPercent: Math.round(count * dpb * 10) / 10, label };
  };
  return [at(0.25, "Getting started"), at(0.5, "Halfway"), at(1, "Max deal")];
}

// ─────────────────────────────────────────────────────────────────────────────
// 8 deals at different progress stages — covers all 4 color states
// ─────────────────────────────────────────────────────────────────────────────

export const COMPLETED_DEALS = [
  {
    id:               "comp-001",
    productName:      "LG C3 OLED 55\" TV",
    productImage:     "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&q=75",
    sellerName:       "LG Official Store",
    buyersJoined:     150,
    buyersTarget:     150,
    originalPrice:    1499,
    finalPrice:       749,
    discountAchieved: 50,
    category:         "Electronics",
  },
  {
    id:               "comp-002",
    productName:      "Apple AirPods Pro 2nd Gen",
    productImage:     "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=75",
    sellerName:       "Apple Authorized",
    buyersJoined:     200,
    buyersTarget:     200,
    originalPrice:    249,
    finalPrice:       149,
    discountAchieved: 40,
    category:         "Electronics",
  },
  {
    id:               "comp-003",
    productName:      "Bali Round-Trip Flight Tickets",
    productImage:     "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=75",
    sellerName:       "Traveloka Official",
    buyersJoined:     80,
    buyersTarget:     80,
    originalPrice:    1200,
    finalPrice:       480,
    discountAchieved: 60,
    category:         "Travel",
  },
  {
    id:               "comp-004",
    productName:      "Samsung Galaxy S24 Ultra",
    productImage:     "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=75",
    sellerName:       "Samsung Official",
    buyersJoined:     120,
    buyersTarget:     120,
    originalPrice:    1299,
    finalPrice:       779,
    discountAchieved: 40,
    category:         "Cell Phones",
  },
] as const

export const MOCK_DEALS: Deal[] = [
  // Deal 1 — 12.5% progress → slate (neutral)
  {
    id:                   "deal-001",
    sellerId:             "seller-001",
    sellerName:           "Samsung Official",
    sellerVerified:       true,
    productName:          'Samsung 65" QLED 4K Smart TV — QN90C Series',
    productImage:         "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80",
    category:             "Electronics",
    originalPrice:        1799,
    currency:             "USD",
    maxDiscountPercent:   50,
    maxBuyersRequired:    40,
    currentBuyerCount:    5,
    deadlineAt:           daysFromNow(5),
    milestones:           milestones(40, 50),
    reservationFeePercent: 10,
    status:               "active",
    createdAt:            new Date(),
  },

  // Deal 2 — 35% progress → gold
  {
    id:                   "deal-002",
    sellerId:             "seller-002",
    sellerName:           "TechMart Pro",
    sellerVerified:       true,
    productName:          'MacBook Pro 14" M3 Pro — 18GB RAM, 512GB SSD',
    productImage:         "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    category:             "Computers",
    originalPrice:        1999,
    currency:             "USD",
    maxDiscountPercent:   50,
    maxBuyersRequired:    40,
    currentBuyerCount:    14,
    deadlineAt:           daysFromNow(3),
    milestones:           milestones(40, 50),
    reservationFeePercent: 10,
    status:               "active",
    createdAt:            new Date(),
  },

  // Deal 3 — 60% progress → orange
  {
    id:                   "deal-003",
    sellerId:             "seller-003",
    sellerName:           "MotoDeals",
    sellerVerified:       true,
    productName:          "Yamaha MT-07 Motorcycle 2024 — Midnight Black",
    productImage:         "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80",
    category:             "Motorcycles",
    originalPrice:        8299,
    currency:             "USD",
    maxDiscountPercent:   40,
    maxBuyersRequired:    40,
    currentBuyerCount:    24,
    deadlineAt:           daysFromNow(7),
    milestones:           milestones(40, 40),
    reservationFeePercent: 10,
    status:               "active",
    createdAt:            new Date(),
  },

  // Deal 4 — 90% progress → green
  {
    id:                   "deal-004",
    sellerId:             "seller-004",
    sellerName:           "VacationsPlus",
    sellerVerified:       true,
    productName:          "Cancún All-Inclusive Resort — 7 Nights for 2",
    productImage:         "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    category:             "Travel",
    originalPrice:        3200,
    currency:             "USD",
    maxDiscountPercent:   50,
    maxBuyersRequired:    40,
    currentBuyerCount:    36,
    deadlineAt:           daysFromNow(10),
    milestones:           milestones(40, 50),
    reservationFeePercent: 10,
    status:               "active",
    createdAt:            new Date(),
  },

  // Deal 5 — 100% progress → green MAX
  {
    id:                   "deal-005",
    sellerId:             "seller-005",
    sellerName:           "MobileKing",
    sellerVerified:       true,
    productName:          "iPhone 16 Pro Max 256GB — Natural Titanium",
    productImage:         "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80",
    category:             "Cell Phones",
    originalPrice:        1199,
    currency:             "USD",
    maxDiscountPercent:   45,
    maxBuyersRequired:    40,
    currentBuyerCount:    40,
    deadlineAt:           daysFromNow(1),
    milestones:           milestones(40, 45),
    reservationFeePercent: 10,
    status:               "active",
    createdAt:            new Date(),
  },

  // Deal 6 — 20% progress, 2 hours left → "Ending Soon" red badge, slate color
  {
    id:                   "deal-006",
    sellerId:             "seller-006",
    sellerName:           "GameZone",
    sellerVerified:       true,
    productName:          "Sony PlayStation 5 Slim + 2 Controllers Bundle",
    productImage:         "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&q=80",
    category:             "Electronics",
    originalPrice:        649,
    currency:             "USD",
    maxDiscountPercent:   40,
    maxBuyersRequired:    40,
    currentBuyerCount:    8,
    deadlineAt:           hoursFromNow(2),
    milestones:           milestones(40, 40),
    reservationFeePercent: 10,
    status:               "active",
    createdAt:            new Date(),
  },

  // Deal 7 — 45% progress → orange zone
  {
    id:                   "deal-007",
    sellerId:             "seller-007",
    sellerName:           "DysonStore",
    sellerVerified:       true,
    productName:          "Dyson V15 Detect Cordless Vacuum — Absolute Extra",
    productImage:         "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80",
    category:             "Home",
    originalPrice:        749,
    currency:             "USD",
    maxDiscountPercent:   45,
    maxBuyersRequired:    50,
    currentBuyerCount:    23,
    deadlineAt:           daysFromNow(4),
    milestones:           milestones(50, 45),
    reservationFeePercent: 10,
    status:               "active",
    createdAt:            new Date(),
  },

  // Deal 8 — 70% progress, almost full → gold zone + "Almost Full" tag
  {
    id:                   "deal-008",
    sellerId:             "seller-008",
    sellerName:           "WatchHouse",
    sellerVerified:       true,
    productName:          "Apple Watch Ultra 2 — Titanium, 49mm, Ocean Band",
    productImage:         "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80",
    category:             "Gadgets",
    originalPrice:        799,
    currency:             "USD",
    maxDiscountPercent:   35,
    maxBuyersRequired:    30,
    currentBuyerCount:    25,
    deadlineAt:           daysFromNow(2),
    milestones:           milestones(30, 35),
    reservationFeePercent: 10,
    status:               "active",
    createdAt:            new Date(),
  },
];

export function getMockDealById(id: string) {
  return MOCK_DEALS.find((d) => d.id === id) ?? null;
}
