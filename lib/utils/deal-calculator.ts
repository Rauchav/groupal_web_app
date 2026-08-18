import { Deal, DealComputedValues } from "@/lib/types/deal";

// Groupal's cut of each sale — a SELLER-side cost only, deducted from the
// seller's payout when a deal closes. Never charged to or shown to buyers.
const SELLER_PLATFORM_FEE_PERCENT = 1.5;

export function computeDealValues(deal: Deal): DealComputedValues {
  const discountPerBuyer = deal.maxDiscountPercent / deal.maxBuyersRequired;
  const currentDiscountPercent = Math.min(
    deal.currentBuyerCount * discountPerBuyer,
    deal.maxDiscountPercent,
  );
  const currentPrice      = deal.originalPrice * (1 - currentDiscountPercent / 100);
  const savingsAmount     = deal.originalPrice - currentPrice;
  const progressPercent   = (deal.currentBuyerCount / deal.maxBuyersRequired) * 100;
  // The reservation is fixed — always calculated from the store (original) price.
  // This is the ONLY amount buyers pay at checkout.
  const reservationAmount = deal.originalPrice * (deal.reservationFeePercent / 100);
  // Seller-side only — NOT part of what the buyer pays. Deducted from the
  // seller's payout at deal completion.
  const sellerPlatformFeeAmount = deal.originalPrice * (SELLER_PLATFORM_FEE_PERCENT / 100);
  // Remaining balance = store price minus the 10% upfront already paid (90% of store price)
  const remainingAmount   = deal.originalPrice - reservationAmount;

  return {
    discountPerBuyer,
    currentDiscountPercent,
    currentPrice,
    savingsAmount,
    progressPercent,
    reservationAmount,
    sellerPlatformFeeAmount,
    remainingAmount,
  };
}

// ── Color scale: reflects reward progression — red is NEVER used here ─────────
// < 25%  neutral blue-gray · 25–50%  gold · 50–75%  orange · 75–100%  green

export function getDiscountColor(progressPercent: number): string {
  if (progressPercent < 25) return "#6B7A99";
  if (progressPercent < 50) return "#EAAD00";
  if (progressPercent < 75) return "#E86300";
  return "#048943";
}

export function getDiscountColorClass(progressPercent: number): string {
  if (progressPercent < 25) return "text-[#6B7A99]";
  if (progressPercent < 50) return "text-[#EAAD00]";
  if (progressPercent < 75) return "text-[#E86300]";
  return "text-[#048943]";
}

export function getProgressBarColor(progressPercent: number): string {
  if (progressPercent < 25) return "bg-[#6B7A99]";
  if (progressPercent < 50) return "bg-[#EAAD00]";
  if (progressPercent < 75) return "bg-[#E86300]";
  return "bg-[#048943]";
}
