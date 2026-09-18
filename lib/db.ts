import { PrismaClient } from "@/lib/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"

// The app's own runtime connection — goes through Supabase's pooled
// connection (DATABASE_URL), unlike prisma.config.ts's CLI connection
// (DIRECT_URL). Prisma 7 requires an explicit driver adapter; there's no
// more implicit schema-based connection the generated client falls back
// to on its own.
//
// Cached on `globalThis` in dev so Next.js's hot-reload doesn't spin up a
// fresh PrismaClient (and a fresh pg connection pool) on every file save —
// the standard Next.js + Prisma singleton pattern.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
