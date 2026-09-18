import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/reviews?limit=6 — the most recent reviews across the whole
// platform (not filtered to one deal), each with just enough of its Deal
// embedded (name + cover image) to render buyers/components/marketplace/
// BuyerReviews.tsx's homepage strip. Public — reviews are shown to every
// visitor, signed in or not, same as deal browsing.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get("limit")) || 6, 20)

  const reviews = await prisma.review.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { deal: { select: { productName: true, productImages: true } } },
  })

  return NextResponse.json({ reviews })
}
