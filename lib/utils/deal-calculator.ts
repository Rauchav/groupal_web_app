import { Deal, DealComputedValues } from "@/lib/types/deal";

export function computeDealValues(deal: Deal): DealComputedValues {
  const discountPerBuyer = deal.maxDiscountPercent / deal.maxBuyersRequired;
  const currentDiscountPercent = Math.min(
    deal.currentBuyerCount * discountPerBuyer,
    deal.maxDiscountPercent,
  );
  const currentPrice     = deal.originalPrice * (1 - currentDiscountPercent / 100);
  const savingsAmount    = deal.originalPrice - currentPrice;
  const progressPercent  = (deal.currentBuyerCount / deal.maxBuyersRequired) * 100;
  const reservationAmount = currentPrice * 0.10;
  const remainingAmount  = currentPrice * 0.90;

  return {
    discountPerBuyer,
    currentDiscountPercent,
    currentPrice,
    savingsAmount,
    progressPercent,
    reservationAmount,
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
