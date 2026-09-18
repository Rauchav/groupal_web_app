import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { Webhook } from "svix"
import { prisma } from "@/lib/db"

// Keeps our own User rows in sync with Clerk — the primary path in
// production (requires CLERK_WEBHOOK_SECRET and a public HTTPS endpoint
// registered in the Clerk dashboard). Local dev has neither by default, so
// lib/auth/current-user.ts's requireUser() also lazily creates a User row
// on first API call as a fallback; whichever fires first wins for a given
// account, the other is a harmless no-op.
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    // Not configured (expected in local dev) — accept and no-op rather
    // than 500, so Clerk doesn't retry a webhook we're not set up for yet.
    return NextResponse.json({ received: true, skipped: "no CLERK_WEBHOOK_SECRET configured" })
  }

  const headerList = await headers()
  const svixId = headerList.get("svix-id")
  const svixTimestamp = headerList.get("svix-timestamp")
  const svixSignature = headerList.get("svix-signature")
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  const body = await req.text()
  let event: { type: string; data: Record<string, unknown> }
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const data = event.data as {
      id: string
      email_addresses?: { id: string; email_address: string }[]
      primary_email_address_id?: string
    }
    const primaryEmail =
      data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.email_address
      ?? data.email_addresses?.[0]?.email_address
    if (primaryEmail) {
      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: { email: primaryEmail },
        create: { clerkId: data.id, email: primaryEmail },
      })
    }
  }

  if (event.type === "user.deleted") {
    const data = event.data as { id?: string }
    if (data.id) {
      // Cascades to every relation (SellerProfile, Deal → everything
      // under it, participations, notifications, likes, reviews) per the
      // onDelete: Cascade already declared throughout schema.prisma.
      await prisma.user.deleteMany({ where: { clerkId: data.id } })
    }
  }

  return NextResponse.json({ received: true })
}
