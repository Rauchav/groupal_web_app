import { NextResponse } from "next/server"
import { MOCK_DEALS } from "@/lib/mock/deals"

export async function GET() {
  return NextResponse.json({ deals: MOCK_DEALS })
}
