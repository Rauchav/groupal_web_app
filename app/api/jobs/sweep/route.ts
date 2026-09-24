import { NextResponse } from "next/server"
import { addDays, differenceInCalendarDays } from "date-fns"
import { prisma } from "@/lib/db"
import { dealInclude, dealRowToApiDeal } from "@/lib/api/deal-include"
import { apiDealToDeal } from "@/lib/api/deal-adapter"
import { computeDealValues, computeEstimatedFinalPrice } from "@/lib/utils/deal-calculator"
import { chargeOffSession, checkPaymentMethodValidity, sendPayout } from "@/lib/payments/gateway"
import { getGracePeriodDays, GRACE_PERIOD_RETRY_OFFSETS_DAYS, HEALTH_CHECK_WINDOW_DAYS } from "@/lib/payments/constants"
import {
  dealEndingSoonCopy, dealCompletedCopy, paymentSuccessCopy, paymentFailedCopy,
  paymentReminderCardIssueCopy, paymentReminderRetryFailedCopy, reservationForfeitedCopy,
  sellerDealCompletedCopy, sellerPayoutSentCopy, sellerPayoutIssueCopy,
} from "@/lib/notifications/copy"
import { createNotification } from "@/lib/notifications/create-notification"
import { sendEndingSoonMarketingEmails } from "@/lib/email/send"

const ENDING_SOON_WINDOW_HOURS = 24

// POST /api/jobs/sweep — the real-DB stand-in for a job scheduler (there's
// no BullMQ/Upstash wired up yet — see CLAUDE.md). Called from every buyer/
// seller page load, same "sweep on read" pattern the old mock
// closeExpiredDeals()/syncDealClosures() used, just running against
// Postgres now instead of MOCK_DEALS + paymentsDb. One call does all four
// jobs the mock split across lib/jobs/*.ts:
//   1. "Ending soon" notifications (<24h left)
//   2. Card health-check reminders (4-5 days out)
//   3. Closing deals past their deadline/max-buyer-count — final charges,
//      grace periods on failure, seller payout
//   4. Grace-period auto-retries (day 1 / day 2) and forfeiture at the
//      grace deadline
// Idempotent throughout — every notification is guarded by a check against
// what's already been sent, so calling this on every page load never
// re-sends anything (see the deal-ending-soon-job's own note on why that
// guard has to be the actual notification history, not just an in-memory
// flag, to avoid the ~30-duplicate-notification class of bug).
export async function POST() {
  const now = new Date()

  const activeDeals = await prisma.deal.findMany({ where: { status: "ACTIVE" }, include: dealInclude })

  for (const dealRow of activeDeals) {
    const deal = apiDealToDeal(dealRowToApiDeal(dealRow))

    // ── 1. Ending soon ──────────────────────────────────────────────
    const hoursLeft = (deal.deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (!dealRow.endingSoonNotified && hoursLeft > 0 && hoursLeft < ENDING_SOON_WINDOW_HOURS) {
      const participants = await prisma.groupBuyParticipation.findMany({
        where: { dealId: deal.id, status: "RESERVATION_PAID" },
      })
      for (const p of participants) {
        const already = await prisma.notification.findFirst({
          where: { userId: p.buyerId, type: "DEAL_ENDING_SOON", data: { path: ["participationId"], equals: p.id } },
        })
        if (already) continue
        await createNotification({
          userId: p.buyerId,
          ...dealEndingSoonCopy({ productName: deal.productName }),
          data: { dealId: deal.id, participationId: p.id },
        })
      }
      await prisma.deal.update({ where: { id: deal.id }, data: { endingSoonNotified: true } })
    }

    // ── 1b. Marketing "closing soon, don't miss it" blast ──────────
    // Independent dedup flag (marketingEndingSoonSent) and independent
    // audience (opted-in buyers NOT already in the deal) from the
    // transactional ending-soon notification above — see
    // lib/email/send.ts's sendEndingSoonMarketingEmails for the full
    // reasoning and Deal.marketingEndingSoonSent's own schema comment.
    if (!dealRow.marketingEndingSoonSent && hoursLeft > 0 && hoursLeft < ENDING_SOON_WINDOW_HOURS) {
      const computed = computeDealValues(deal)
      const participants = await prisma.groupBuyParticipation.findMany({
        where: { dealId: deal.id },
        select: { buyerId: true },
      })
      await sendEndingSoonMarketingEmails(
        { id: deal.id, productName: deal.productName, productImages: deal.productImages },
        computed.currentDiscountPercent,
        participants.map((p) => p.buyerId)
      )
      await prisma.deal.update({ where: { id: deal.id }, data: { marketingEndingSoonSent: true } })
    }

    // ── 2. Card health-check ────────────────────────────────────────
    const daysUntilDeadline = differenceInCalendarDays(deal.deadlineAt, now)
    if (daysUntilDeadline >= HEALTH_CHECK_WINDOW_DAYS.min && daysUntilDeadline <= HEALTH_CHECK_WINDOW_DAYS.max) {
      const participants = await prisma.groupBuyParticipation.findMany({
        where: { dealId: deal.id, status: "RESERVATION_PAID" },
      })
      for (const p of participants) {
        const { valid } = await checkPaymentMethodValidity(p.paymentMethodRef)
        if (valid) continue
        const already = await prisma.notification.findFirst({
          where: { userId: p.buyerId, type: "PAYMENT_REMINDER", data: { path: ["participationId"], equals: p.id } },
        })
        if (already) continue
        await createNotification({
          userId: p.buyerId,
          ...paymentReminderCardIssueCopy({ productName: deal.productName }),
          data: { dealId: deal.id, participationId: p.id, kind: "card_health" },
        })
      }
    }

    // ── 3. Close the deal if it's hit its deadline or max buyers ───
    if (now >= deal.deadlineAt || deal.currentBuyerCount >= deal.maxBuyersRequired) {
      const participants = await prisma.groupBuyParticipation.findMany({
        where: { dealId: deal.id, status: "RESERVATION_PAID" },
      })
      const computed = computeDealValues(deal)

      for (const p of participants) {
        const finalPrice = computeEstimatedFinalPrice(deal, p.deliveryCost)
        await prisma.groupBuyParticipation.update({
          where: { id: p.id },
          data: { status: "AWAITING_FINAL_PAYMENT", finalDiscountPercent: computed.currentDiscountPercent, finalPrice },
        })
        await createNotification({
          userId: p.buyerId,
          ...dealCompletedCopy({
            productName: deal.productName,
            buyerCount: deal.currentBuyerCount,
            discountPercent: computed.currentDiscountPercent,
            savingsAmount: computed.savingsAmount,
            currency: deal.currency,
          }),
          data: { dealId: deal.id, participationId: p.id },
        })

        const charge = await chargeOffSession(p.paymentMethodRef, finalPrice)
        await prisma.payment.create({
          data: {
            participationId: p.id,
            amount: finalPrice,
            type: "FINAL_PAYMENT",
            status: charge.success ? "FINAL_PAYMENT_PAID" : "PAYMENT_FAILED",
            stripeId: charge.stripeId,
            failureReason: charge.failureReason,
          },
        })

        if (charge.success) {
          await prisma.groupBuyParticipation.update({ where: { id: p.id }, data: { status: "FINAL_PAYMENT_PAID" } })
          await createNotification({
            userId: p.buyerId,
            ...paymentSuccessCopy({ productName: deal.productName, firstAttempt: true }),
            data: { dealId: deal.id, participationId: p.id },
          })
        } else {
          const gracePeriodDays = getGracePeriodDays(deal.originalPrice)
          const graceDeadline = addDays(now, gracePeriodDays)
          await prisma.groupBuyParticipation.update({
            where: { id: p.id },
            data: { status: "IN_GRACE_PERIOD", gracePeriodDays, graceDeadline },
          })
          await createNotification({
            userId: p.buyerId,
            ...paymentFailedCopy({ productName: deal.productName, gracePeriodDays }),
            data: { dealId: deal.id, participationId: p.id },
          })
        }
      }

      if (participants.length > 0) {
        const grossRevenue = computed.currentPrice * participants.length
        const commission = computed.sellerPlatformFeeAmount * participants.length
        const netPayout = grossRevenue - commission

        await createNotification({
          userId: dealRow.seller.userId,
          ...sellerDealCompletedCopy({
            productName: deal.productName,
            unitsSold: participants.length,
            discountPercent: computed.currentDiscountPercent,
            grossRevenue,
            commission,
            netPayout,
            currency: deal.currency,
          }),
          data: { dealId: deal.id },
        })

        const payout = await sendPayout(netPayout)
        await createNotification({
          userId: dealRow.seller.userId,
          ...(payout.success
            ? sellerPayoutSentCopy({ productName: deal.productName, netPayout, currency: deal.currency })
            : sellerPayoutIssueCopy({ productName: deal.productName, netPayout, currency: deal.currency })),
          data: { dealId: deal.id },
        })
      }

      await prisma.deal.update({ where: { id: deal.id }, data: { status: "COMPLETED" } })
    }
  }

  // ── 4. Grace-period retries and forfeitures — independent of deal
  // status above, since a deal already moved to COMPLETED this same sweep
  // (or an earlier one) can still have participations working through
  // their grace period. ─────────────────────────────────────────────
  const inGrace = await prisma.groupBuyParticipation.findMany({
    where: { status: "IN_GRACE_PERIOD" },
    include: { deal: { select: { id: true, productName: true, currentBuyerCount: true } } },
  })

  for (const p of inGrace) {
    if (!p.graceDeadline) continue

    if (now >= p.graceDeadline) {
      await prisma.groupBuyParticipation.update({ where: { id: p.id }, data: { status: "FORFEITED" } })
      if (p.deal.currentBuyerCount > 0) {
        await prisma.deal.update({ where: { id: p.deal.id }, data: { currentBuyerCount: { decrement: 1 } } })
      }
      await createNotification({
        userId: p.buyerId,
        ...reservationForfeitedCopy({ productName: p.deal.productName }),
        data: { dealId: p.deal.id, participationId: p.id },
      })
      continue
    }

    const gracePeriodStart = addDays(p.graceDeadline, -(p.gracePeriodDays ?? 0))
    const daysSinceStart = differenceInCalendarDays(now, gracePeriodStart)
    const nextOffsetIndex = p.retryAttempts
    const dueOffset = GRACE_PERIOD_RETRY_OFFSETS_DAYS[nextOffsetIndex]
    if (dueOffset === undefined || daysSinceStart < dueOffset) continue

    const amount = p.finalPrice!
    const charge = await chargeOffSession(p.paymentMethodRef, amount)
    await prisma.payment.create({
      data: {
        participationId: p.id,
        amount,
        type: "FINAL_PAYMENT",
        status: charge.success ? "FINAL_PAYMENT_PAID" : "PAYMENT_FAILED",
        stripeId: charge.stripeId,
        failureReason: charge.failureReason,
      },
    })

    if (charge.success) {
      await prisma.groupBuyParticipation.update({ where: { id: p.id }, data: { status: "FINAL_PAYMENT_PAID" } })
      await createNotification({
        userId: p.buyerId,
        ...paymentSuccessCopy({ productName: p.deal.productName, firstAttempt: false }),
        data: { dealId: p.deal.id, participationId: p.id },
      })
    } else {
      await prisma.groupBuyParticipation.update({ where: { id: p.id }, data: { retryAttempts: p.retryAttempts + 1 } })
      await createNotification({
        userId: p.buyerId,
        ...paymentReminderRetryFailedCopy({ productName: p.deal.productName, graceDeadline: p.graceDeadline }),
        data: { dealId: p.deal.id, participationId: p.id },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
