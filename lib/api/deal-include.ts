import type { Prisma } from "@/lib/generated/prisma"
import type { ApiDeal } from "@/lib/api/deal-adapter"

// Shared Prisma `include` shape for a Deal, reused by every route that
// returns one (GET /api/deals, GET /api/deals/[id], GET /api/participations,
// GET /api/deals/[id]/participants) so lib/api/deal-adapter.ts's
// apiDealToDeal() always has exactly the fields it expects, regardless of
// which route the wire data came from.
export const dealInclude = {
  // userId (SellerProfile's own FK to User) is only needed server-side —
  // to target a SELLER_* notification at the right User row — never read
  // client-side (apiDealToDeal only surfaces seller.user.clerkId).
  seller: { select: { userId: true, companyName: true, verified: true, website: true, user: { select: { clerkId: true } } } },
  milestones: true,
  deliveryZones: true,
  reach: true,
} as const

export type DealRow = Prisma.DealGetPayload<{ include: typeof dealInclude }>

// apiDealToDeal() expects the JSON-over-the-wire shape (dates as ISO
// strings, per ApiDeal) — exactly what a client gets after a real HTTP
// round trip. Server-side code that wants to reuse apiDealToDeal()/
// computeDealValues() directly on a fresh Prisma row (no HTTP round trip
// in between — e.g. the join and sweep routes) needs this same conversion
// done by hand first.
export function dealRowToApiDeal(row: DealRow): ApiDeal {
  return {
    ...row,
    deadlineAt: row.deadlineAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    pickupDetails: row.pickupDetails as ApiDeal["pickupDetails"],
  }
}
