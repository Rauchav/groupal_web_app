import type { Deal, DealReach, DealReachScope, DiscountMilestone, DeliveryZone, PickupDetails } from "@/lib/types/deal"

// The wire shape GET /api/deals and GET /api/deals/[id] actually return —
// Prisma's real relational shape (nested seller, one row per reach value,
// uppercase enums, ISO date strings over JSON) — adapted here into the
// exact Deal shape every existing buyer/seller component already expects
// (DealCard, computeDealValues, the checkout page, …), so none of them
// need to know or care whether a Deal came from MOCK_DEALS or a real API
// call. This is what makes wiring the frontend to real data a cutover
// instead of a rewrite of every consuming component.
export interface ApiDeal {
  id: string
  sellerId: string
  productName: string
  productDescription: string | null
  productImages: string[]
  category: string
  originalPrice: number
  currency: string
  maxDiscountPercent: number
  maxBuyersRequired: number
  currentBuyerCount: number
  deadlineAt: string
  deliveryType: "DELIVERY" | "PICKUP"
  pickupDetails: PickupDetails | null
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
  externalProductUrl: string | null
  createdAt: string
  seller: { companyName: string; verified: boolean; website: string | null; user: { clerkId: string } }
  milestones: DiscountMilestone[]
  deliveryZones: DeliveryZone[]
  reach: { scope: "CITY" | "COUNTRY" | "CONTINENT"; value: string }[]
}

export function apiDealToDeal(d: ApiDeal): Deal {
  const reach: DealReach | undefined =
    d.reach.length > 0
      ? { scope: d.reach[0].scope.toLowerCase() as DealReachScope, values: d.reach.map((r) => r.value) }
      : undefined

  return {
    id: d.id,
    sellerId: d.sellerId,
    sellerUserId: d.seller.user.clerkId,
    sellerName: d.seller.companyName,
    sellerVerified: d.seller.verified,
    sellerUrl: d.seller.website ?? undefined,
    productName: d.productName,
    productDescription: d.productDescription ?? undefined,
    productImages: d.productImages,
    category: d.category,
    originalPrice: d.originalPrice,
    currency: d.currency,
    maxDiscountPercent: d.maxDiscountPercent,
    maxBuyersRequired: d.maxBuyersRequired,
    currentBuyerCount: d.currentBuyerCount,
    deadlineAt: new Date(d.deadlineAt),
    milestones: d.milestones,
    reservationFeePercent: 10,
    isPickup: d.deliveryType === "PICKUP",
    pickupDetails: d.pickupDetails ?? undefined,
    deliveryZones: d.deliveryZones.length > 0 ? d.deliveryZones : undefined,
    status: d.status.toLowerCase() as Deal["status"],
    createdAt: new Date(d.createdAt),
    externalProductUrl: d.externalProductUrl ?? undefined,
    reach,
  }
}
