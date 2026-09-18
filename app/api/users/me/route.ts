import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"

// GET /api/users/me — the caller's own account. Lazily creates the User
// row (via requireUser()) if Clerk's webhook hasn't already, same as every
// other authenticated route — see lib/auth/current-user.ts. Used to
// resolve: notification preferences (settings page), the "My Group Buys" /
// "Purchases" badge snapshots, and the buyer/seller cross-registration
// guard (hasBuyerActivity).
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  return NextResponse.json({
    id: user.id,
    role: user.role,
    notificationPreferences: user.notificationPreferences,
    lastViewedGroupBuysCount: user.lastViewedGroupBuysCount,
    lastViewedPurchasesCount: user.lastViewedPurchasesCount,
    hasBuyerActivity: user.hasBuyerActivity,
  })
}

const patchSchema = z.object({
  notificationPreferences: z.record(z.string(), z.boolean()).optional(),
  lastViewedGroupBuysCount: z.number().int().min(0).optional(),
  lastViewedPurchasesCount: z.number().int().min(0).optional(),
  hasBuyerActivity: z.boolean().optional(),
})

// PATCH /api/users/me — always operates on the caller's own row, resolved
// server-side from the session; the request body can never target another
// user. Every field is optional so a caller only sends what it's changing
// (e.g. the settings page only ever sends notificationPreferences).
export async function PATCH(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      notificationPreferences: data.notificationPreferences
        ? { ...(user.notificationPreferences as object ?? {}), ...data.notificationPreferences }
        : undefined,
      lastViewedGroupBuysCount: data.lastViewedGroupBuysCount,
      lastViewedPurchasesCount: data.lastViewedPurchasesCount,
      hasBuyerActivity: data.hasBuyerActivity,
    },
  })

  return NextResponse.json({
    role: updated.role,
    notificationPreferences: updated.notificationPreferences,
    lastViewedGroupBuysCount: updated.lastViewedGroupBuysCount,
    lastViewedPurchasesCount: updated.lastViewedPurchasesCount,
    hasBuyerActivity: updated.hasBuyerActivity,
  })
}
