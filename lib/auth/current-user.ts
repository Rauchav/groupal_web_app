import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import type { User } from "@/lib/generated/prisma"

// The one place every API route resolves "who's calling" into a real User
// row. Primarily relies on the Clerk webhook (app/api/webhooks/clerk/
// route.ts) having already created the row on sign-up, but lazily creates
// one here too if it hasn't (yet) — local dev has no public HTTPS endpoint
// for Clerk to webhook, so without this fallback, every API call from a
// freshly-signed-up account would 401 until someone manually wires up a
// tunnel. Production keeps both paths: whichever fires first wins, and the
// other becomes a harmless no-op (findUnique short-circuits it).
export async function requireUser(): Promise<User | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const existing = await prisma.user.findUnique({ where: { clerkId } })
  if (existing) return existing

  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? `${clerkId}@unknown.groupal.internal`

  // Two requests racing to lazily create the same brand-new user is rare
  // but possible (e.g. a page firing several API calls on first load) —
  // clerkId is @unique, so the loser's create() throws; re-reading instead
  // of failing the request is cheap insurance against that race.
  try {
    return await prisma.user.create({ data: { clerkId, email } })
  } catch {
    return prisma.user.findUnique({ where: { clerkId } })
  }
}

// For routes that only care about the Clerk id itself (not a full User
// row) — e.g. deciding whether to even attempt a lookup.
export async function requireClerkId(): Promise<string | null> {
  const { userId } = await auth()
  return userId ?? null
}
