import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"
import { dealInclude, dealRowToApiDeal } from "@/lib/api/deal-include"
import { apiDealToDeal } from "@/lib/api/deal-adapter"
import { computeDealValues } from "@/lib/utils/deal-calculator"
import { saveMockPaymentMethod, chargeOffSession } from "@/lib/payments/gateway"
import { dealJoinedCopy, dealProgressCopy, sellerNewBuyerCopy } from "@/lib/notifications/copy"

// POST /api/deals/[id]/join — the reservation charge (the "today" 10%
// payment) and everything it triggers: the buyer's GroupBuyParticipation +
// Payment(RESERVATION) rows, the real Deal's currentBuyerCount increment,
// and every notification that goes out the moment someone joins (the
// buyer, the seller, and everyone else already in the group whose price
// just dropped). This is the real-DB replacement for the old
// lib/payments/reservation-service.ts's chargeReservation() — same
// sequence of effects, just against Prisma instead of the mock
// paymentsDb/MOCK_DEALS layer.
const joinSchema = z.object({
  buyerName: z.string().min(1),
  buyerAvatarUrl: z.string().url().optional(),
  deliveryCost: z.number().min(0).default(0),
  deliveryAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      zipCode: z.string().optional(),
    })
    .optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = joinSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const { id: dealId } = await params

  // Hard backstop against a double reservation, same guarantee the mock
  // engine had via getParticipationByDealAndBuyer — the unique
  // [dealId, buyerId] index also enforces this at the DB level, but
  // checking first lets us return a clean, specific error instead of a
  // raw constraint-violation 500.
  const existing = await prisma.groupBuyParticipation.findUnique({
    where: { dealId_buyerId: { dealId, buyerId: user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "already_joined", participation: existing }, { status: 409 })
  }

  const dealRow = await prisma.deal.findUnique({ where: { id: dealId }, include: dealInclude })
  if (!dealRow) return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  if (dealRow.status !== "ACTIVE") {
    return NextResponse.json({ error: "This deal is no longer active" }, { status: 409 })
  }

  const deal = apiDealToDeal(dealRowToApiDeal(dealRow))
  const computed = computeDealValues(deal)

  const paymentMethod = saveMockPaymentMethod()
  const charge = await chargeOffSession(paymentMethod.ref, computed.reservationAmount)
  if (!charge.success) {
    return NextResponse.json({ error: charge.failureReason ?? "card_declined" }, { status: 402 })
  }

  // Everyone else already in the group, captured BEFORE the new
  // participation is created — they each get a "your discount just grew"
  // nudge; the buyer who just joined gets their own "you're in!" instead.
  const otherParticipants = await prisma.groupBuyParticipation.findMany({
    where: { dealId, status: "RESERVATION_PAID" },
  })

  const participation = await prisma.groupBuyParticipation.create({
    data: {
      dealId,
      buyerId: user.id,
      buyerName: data.buyerName,
      buyerAvatarUrl: data.buyerAvatarUrl,
      reservationAmount: computed.reservationAmount,
      platformFee: computed.sellerPlatformFeeAmount,
      deliveryCost: data.deliveryCost,
      status: "RESERVATION_PAID",
      paymentMethodRef: paymentMethod.ref,
      stripePaymentIntentId: charge.stripeId,
      deliveryAddress: data.deliveryAddress,
    },
  })

  await prisma.payment.create({
    data: {
      participationId: participation.id,
      amount: computed.reservationAmount,
      type: "RESERVATION",
      status: "RESERVATION_PAID",
      stripeId: charge.stripeId,
    },
  })

  // Mirrors releaseDealSpot's decrement on forfeiture (the sweep job) —
  // every successful join grows the live group, which is what lets a deal
  // actually reach maxBuyersRequired and auto-close.
  const updatedDealRow =
    deal.currentBuyerCount < deal.maxBuyersRequired
      ? await prisma.deal.update({ where: { id: dealId }, data: { currentBuyerCount: { increment: 1 } }, include: dealInclude })
      : dealRow
  const updatedDeal = apiDealToDeal(dealRowToApiDeal(updatedDealRow))
  const updatedComputed = computeDealValues(updatedDeal)

  await prisma.notification.create({
    data: {
      userId: user.id,
      ...dealJoinedCopy({ productName: deal.productName }),
      data: { dealId, participationId: participation.id },
    },
  })

  await prisma.notification.create({
    data: {
      userId: dealRow.seller.userId,
      ...sellerNewBuyerCopy({
        productName: deal.productName,
        buyerCount: updatedDeal.currentBuyerCount,
        maxBuyers: deal.maxBuyersRequired,
        discountPercent: updatedComputed.currentDiscountPercent,
      }),
      data: { dealId },
    },
  })

  // Same "one notification per existing participant on every join" note as
  // the old engine — intentional given the discount mechanic (everyone's
  // price really does move every time), not a bug.
  if (otherParticipants.length > 0) {
    await prisma.notification.createMany({
      data: otherParticipants.map((other) => ({
        userId: other.buyerId,
        ...dealProgressCopy({
          productName: deal.productName,
          buyerCount: updatedDeal.currentBuyerCount,
          maxBuyers: deal.maxBuyersRequired,
          discountPercent: updatedComputed.currentDiscountPercent,
        }),
        data: { dealId, participationId: other.id },
      })),
    })
  }

  return NextResponse.json({ participation }, { status: 201 })
}
