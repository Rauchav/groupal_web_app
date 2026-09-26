import { Deal, DiscountMilestone } from "@/lib/types/deal";

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

export function daysFromNow(d: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date;
}

// Generates 3 milestone markers at 25%, 50%, and 100% of maxBuyers — exported
// so seller-created deals (sellers/stores/seller-deals-store.ts) compute
// milestones identically to every seed deal here, instead of duplicating
// the math.
export function milestones(maxBuyers: number, maxDiscount: number): DiscountMilestone[] {
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
    id:                 "comp-001",
    productName:        "LG C3 OLED 55\" TV",
    productImage:       "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&q=75",
    sellerName:         "LG Official Store",
    buyersJoined:       150,
    buyersTarget:       150,
    originalPrice:      1499,
    finalPrice:         749,
    discountAchieved:   50,
    category:           "Electronics",
    externalProductUrl: "https://www.lg.com/us/tvs",
  },
  {
    id:                 "comp-002",
    productName:        "Apple AirPods Pro 2nd Gen",
    productImage:       "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=75",
    sellerName:         "Apple Authorized",
    buyersJoined:       200,
    buyersTarget:       200,
    originalPrice:      249,
    finalPrice:         149,
    discountAchieved:   40,
    category:           "Electronics",
    externalProductUrl: "https://www.apple.com/airpods-pro/",
  },
  {
    id:                 "comp-003",
    productName:        "Bali Round Trip Flight Tickets",
    productImage:       "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=75",
    sellerName:         "Traveloka Official",
    buyersJoined:       80,
    buyersTarget:       80,
    originalPrice:      1200,
    finalPrice:         480,
    discountAchieved:   60,
    category:           "Travels",
    externalProductUrl: "https://www.traveloka.com/en-en/flight",
  },
  {
    id:                 "comp-004",
    productName:        "Samsung Galaxy S24 Ultra",
    productImage:       "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=75",
    sellerName:         "Samsung Official",
    buyersJoined:       120,
    buyersTarget:       120,
    originalPrice:      1299,
    finalPrice:         779,
    discountAchieved:   40,
    category:           "Smartphones",
    externalProductUrl: "https://www.samsung.com/us/smartphones/galaxy-s24-ultra/",
  },
] as const

export const MOCK_DEALS: Deal[] = [
  // Deal 1 — 12.5% progress → slate (neutral)
  {
    id:                   "deal-001",
    sellerId:             "seller-001",
    sellerUserId:         "seller-001",
    sellerName:           "Samsung Official",
    sellerVerified:       true,
    productName:          'Samsung 65" QLED 4K Smart TV, QN90C Series',
    productDescription:   "Neo QLED 4K panel with Quantum Matrix Technology and a Neural Quantum Processor 4K for sharper upscaling. Includes 4 HDMI 2.1 ports (great for next-gen consoles at 120Hz), built-in Alexa and Google Assistant, and a slim wall-mount kit in the box.",
    externalProductUrl:   "https://www.samsung.com/us/televisions-home-theater/tvs/",
    productImages:        ["https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80"],
    category:             "Electronics",
    originalPrice:        1799,
    currency:             "USD",
    maxDiscountPercent:   50,
    maxBuyersRequired:    40,
    currentBuyerCount:    5,
    deadlineAt:           daysFromNow(5),
    milestones:           milestones(40, 50),
    reservationFeePercent: 10,
    isPickup:             false,
    status:               "active",
    createdAt:            daysFromNow(-21),
  },

  // Deal 2 — 35% progress → gold
  {
    id:                   "deal-002",
    sellerId:             "seller-002",
    sellerUserId:         "seller-002",
    sellerName:           "TechMart Pro",
    sellerVerified:       true,
    productName:          'MacBook Pro 14" M3 Pro, 18GB RAM, 512GB SSD',
    productDescription:   "Apple M3 Pro chip (11-core CPU, 14-core GPU), 18GB unified memory, and 512GB SSD storage. Liquid Retina XDR display, up to 18 hours of battery life, and three Thunderbolt 4 ports. Brand new, sealed retail packaging.",
    externalProductUrl:   "https://www.apple.com/macbook-pro/",
    productImages:        ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80"],
    category:             "Computers",
    originalPrice:        1999,
    currency:             "USD",
    maxDiscountPercent:   50,
    maxBuyersRequired:    40,
    currentBuyerCount:    14,
    deadlineAt:           daysFromNow(3),
    milestones:           milestones(40, 50),
    reservationFeePercent: 10,
    isPickup:             false,
    status:               "active",
    createdAt:            daysFromNow(-18),
  },

  // Deal 3 — 60% progress → orange
  {
    id:                   "deal-003",
    sellerId:             "seller-003",
    sellerUserId:         "seller-003",
    sellerName:           "MotoDeals",
    sellerVerified:       true,
    productName:          "Yamaha MT07 Motorcycle 2024, Midnight Black",
    productDescription:   "689cc CP2 twin-cylinder engine, lightweight steel frame, and full LED lighting. Includes a 2-year manufacturer warranty and a complimentary first service. Delivered fully assembled and street-ready, with registration paperwork handled by the dealer.",
    externalProductUrl:   "https://www.yamahamotorsports.com/sport/models/mt-07",
    productImages:        ["https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80"],
    category:             "Motors",
    originalPrice:        8299,
    currency:             "USD",
    maxDiscountPercent:   40,
    maxBuyersRequired:    40,
    currentBuyerCount:    24,
    deadlineAt:           daysFromNow(7),
    milestones:           milestones(40, 40),
    reservationFeePercent: 10,
    isPickup:             false,
    status:               "active",
    createdAt:            daysFromNow(-15),
  },

  // Deal 4 — 90% progress → green
  {
    id:                   "deal-004",
    sellerId:             "seller-004",
    sellerUserId:         "seller-004",
    sellerName:           "VacationsPlus",
    sellerVerified:       true,
    productName:          "Cancún All-Inclusive Resort, 7 Nights for 2",
    productDescription:   "7 nights for 2 guests at the beachfront Riu Palace Peninsula (5-star, adults-only), all-inclusive: every meal, unlimited premium drinks, daily activities, and nightly entertainment. Includes a swim-up junior suite, round-trip airport transfers, and full access to the resort's 3 pools, spa, and water sports. Flights not included.",
    externalProductUrl:   "https://www.vacationsplus.example.com",
    productImages:        ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"],
    category:             "Travels",
    originalPrice:        3200,
    currency:             "USD",
    maxDiscountPercent:   50,
    maxBuyersRequired:    40,
    currentBuyerCount:    36,
    deadlineAt:           daysFromNow(10),
    milestones:           milestones(40, 50),
    reservationFeePercent: 10,
    isPickup:             true,
    pickupDetails: {
      location:         "VacationsPlus Travel Center, Av. Arce 2450, La Paz, Bolivia",
      hours:             "Mon–Sat, 9:00 AM – 6:00 PM",
      instructions:      "Once the deal closes, stop by the travel center any time during business hours. Our team will issue your printed vouchers and walk you through your full itinerary on the spot, no appointment needed.",
      codeRequired:      "Your Groupal order confirmation code (emailed to you once the deal closes)",
      documentsRequired: "A valid photo ID matching the name on your reservation",
      contactName:       "VacationsPlus Support",
      contactPhone:      "+591 2 244 1122",
      contactEmail:      "support@vacationsplus.example.com",
    },
    status:               "active",
    createdAt:            daysFromNow(-12),
  },

  // Deal 5 — 90% progress → green zone, almost full but still active
  {
    id:                   "deal-005",
    sellerId:             "seller-005",
    sellerUserId:         "seller-005",
    sellerName:           "MobileKing",
    sellerVerified:       true,
    productName:          "iPhone 16 Pro Max 256GB, Natural Titanium",
    productDescription:   "6.9-inch Super Retina XDR display, A18 Pro chip, and a 48MP Fusion camera system with 5x telephoto zoom. 256GB storage, titanium frame, and Camera Control button. Factory unlocked, brand new in sealed box.",
    externalProductUrl:   "https://www.apple.com/iphone-16-pro/",
    productImages:        ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80"],
    category:             "Smartphones",
    originalPrice:        1199,
    currency:             "USD",
    maxDiscountPercent:   45,
    maxBuyersRequired:    40,
    currentBuyerCount:    36,
    deadlineAt:           daysFromNow(1),
    milestones:           milestones(40, 45),
    reservationFeePercent: 10,
    isPickup:             false,
    status:               "active",
    createdAt:            daysFromNow(-9),
  },

  // Deal 6 — 20% progress, 2 hours left → "Ending Soon" red badge, slate color
  {
    id:                   "deal-006",
    sellerId:             "seller-006",
    sellerUserId:         "seller-006",
    sellerName:           "GameZone",
    sellerVerified:       true,
    productName:          "Sony PlayStation 5 Slim + 2 Controllers Bundle",
    productDescription:   "PS5 Slim console (1TB) bundled with 2 DualSense wireless controllers. Supports 4K gaming at up to 120fps, ray tracing, and ultra-high-speed SSD for near-instant load times. Brand new, sealed retail box.",
    externalProductUrl:   "https://www.playstation.com/en-us/ps5/",
    productImages:        ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&q=80"],
    category:             "Electronics",
    originalPrice:        649,
    currency:             "USD",
    maxDiscountPercent:   40,
    maxBuyersRequired:    40,
    currentBuyerCount:    8,
    deadlineAt:           hoursFromNow(2),
    milestones:           milestones(40, 40),
    reservationFeePercent: 10,
    isPickup:             false,
    status:               "active",
    createdAt:            daysFromNow(-6),
  },

  // Deal 7 — 45% progress → orange zone
  {
    id:                   "deal-007",
    sellerId:             "seller-007",
    sellerUserId:         "seller-007",
    sellerName:           "DysonStore",
    sellerVerified:       true,
    productName:          "Dyson V15 Detect Cordless Vacuum, Absolute Extra",
    productDescription:   "Laser dust detection, LCD screen showing particle counts in real time, and up to 60 minutes of run time. Includes the full head kit: fluffy optic cleaner head, hair screw tool, and mini motorised tool for upholstery. HEPA filtration seals in allergens.",
    externalProductUrl:   "https://www.dyson.com/vacuum-cleaners/cordless-vacuums/v15",
    productImages:        ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80"],
    category:             "Home",
    originalPrice:        749,
    currency:             "USD",
    maxDiscountPercent:   45,
    maxBuyersRequired:    50,
    currentBuyerCount:    23,
    deadlineAt:           daysFromNow(4),
    milestones:           milestones(50, 45),
    reservationFeePercent: 10,
    isPickup:             false,
    status:               "active",
    createdAt:            daysFromNow(-3),
  },

  // Deal 8 — 70% progress, almost full → gold zone + "Almost Full" tag
  {
    id:                   "deal-008",
    sellerId:             "seller-008",
    sellerUserId:         "seller-008",
    sellerName:           "WatchHouse",
    sellerVerified:       true,
    productName:          "Apple Watch Ultra 2, Titanium, 49mm, Ocean Band",
    productDescription:   "49mm titanium case with a brighter 3000-nit display, dual-frequency GPS, and up to 36 hours of battery life. Water resistant to 100m with dive computer app support. Comes with the blue Ocean Band and factory sealed.",
    externalProductUrl:   "https://www.apple.com/apple-watch-ultra-2/",
    productImages:        ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80"],
    category:             "Electronics",
    originalPrice:        799,
    currency:             "USD",
    maxDiscountPercent:   35,
    maxBuyersRequired:    30,
    currentBuyerCount:    25,
    deadlineAt:           daysFromNow(2),
    milestones:           milestones(30, 35),
    reservationFeePercent: 10,
    isPickup:             false,
    status:               "active",
    createdAt:            daysFromNow(-1),
  },
];

