import { prisma } from "@/lib/db"
import type { Prisma } from "@/lib/generated/prisma"
import { sendNotificationEmail } from "@/lib/email/send"
import type { NotificationType } from "@/lib/types/payment"

interface NotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
}

// The ONE place every in-app Notification row gets created — every API
// route that used to call `prisma.notification.create()` directly now
// calls this instead, so the corresponding email (lib/email/send.ts) can
// never be forgotten at a new call site the way it would be if each route
// had to remember to fire it separately. Awaited (not fire-and-forget):
// this runs in serverless route handlers where an un-awaited promise can
// be killed the moment the response is sent, so a "fire and forget" email
// send would silently never go out half the time. sendNotificationEmail
// itself never throws, so awaiting it here can't turn an email hiccup into
// a failed API request.
export async function createNotification(input: NotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data as Prisma.InputJsonValue | undefined,
    },
  })
  await sendNotificationEmail(input)
  return notification
}

// Bulk counterpart (lib/payments/reservation-service.ts's old
// dealProgressCopy fan-out, now POST /api/deals/[id]/join's
// otherParticipants loop) — one prisma.notification.createMany() for the
// DB rows, then every email sent in parallel rather than sequentially so
// one join doesn't serialize N network round-trips to Resend.
export async function createNotifications(inputs: NotificationInput[]) {
  if (inputs.length === 0) return
  await prisma.notification.createMany({
    data: inputs.map((i) => ({
      userId: i.userId,
      type: i.type,
      title: i.title,
      message: i.message,
      data: i.data as Prisma.InputJsonValue | undefined,
    })),
  })
  await Promise.allSettled(inputs.map((i) => sendNotificationEmail(i)))
}
