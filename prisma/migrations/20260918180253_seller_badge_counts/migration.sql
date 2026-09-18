-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN     "lastViewedClosedDealsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastViewedDealsCount" INTEGER NOT NULL DEFAULT 0;
