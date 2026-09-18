-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasBuyerActivity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastViewedGroupBuysCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastViewedPurchasesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notificationPreferences" JSONB;
