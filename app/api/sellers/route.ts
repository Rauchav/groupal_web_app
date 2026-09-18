import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireUser } from "@/lib/auth/current-user"

// GET /api/sellers — the caller's own seller profile, or null if they
// haven't onboarded as a seller yet. Mirrors sellers/stores/
// seller-store.ts's useSellerProfile(userId), but resolved server-side
// from the real signed-in session rather than trusting a client-supplied
// userId.
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const profile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } })
  return NextResponse.json({ profile })
}

const createSchema = z.object({
  companyName: z.string().min(2),
  category: z.string().min(1),
  phone: z.string().min(6),
  city: z.string().min(2),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
})

// POST /api/sellers — seller onboarding (app/sellers/page.tsx's
// OnboardingStep). One profile per account, same invariant the mock
// createProfile() already enforced — a repeat call for an
// already-onboarded account just returns the existing profile rather than
// erroring, since the buyer/seller exclusivity guards already stop a
// buyer account from reaching this form at all.
export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const profile = await prisma.sellerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      companyName: data.companyName,
      category: data.category,
      phone: data.phone,
      city: data.city,
      website: data.website || undefined,
      description: data.description || undefined,
      logoUrl: data.logoUrl || undefined,
    },
  })

  if (user.role !== "SELLER") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "SELLER" } })
  }

  return NextResponse.json({ profile }, { status: 201 })
}
