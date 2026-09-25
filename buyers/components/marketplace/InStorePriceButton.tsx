"use client";

import { ExternalLink } from "lucide-react";

function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Opens a deal's exact product page on the seller's own site
// (externalProductUrl, set at deal creation — see app/sellers/dashboard/
// deals/new/page.tsx), falling back to the seller's general storefront
// (sellerUrl) for a deal created before that field existed. Shared across
// every place a buyer sees a deal's regular store price: DealCard's and
// CompletedDealCard's navy pricing block (both sit at the very top, above
// the groupal price), and the checkout page's Review Deal step (same
// position, over "Current groupal price"). Styled for a navy background —
// see each card's own white "in store price" treatment before this
// consolidation for the light-background version this replaced.
export function InStorePriceButton({
  price,
  currency,
  url,
}: {
  price:     number;
  currency?: string;
  url?:      string;
}) {
  if (!url) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        window.open(url, "_blank", "noopener,noreferrer");
      }}
      className="inline-flex items-center justify-between gap-2 w-full rounded-lg border border-white/15 px-3 py-2 hover:border-white/30 hover:bg-white/5 transition-all duration-150 cursor-pointer group/store"
    >
      <div className="flex flex-col leading-none text-left">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/50 group-hover/store:text-white/70">
          In Store Price
        </span>
        <span className="text-sm font-bold text-white/70 line-through tabular-nums mt-0.5">
          {formatPrice(price, currency)}
        </span>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-white/40 group-hover/store:text-white/70 flex-shrink-0 transition-colors" />
    </button>
  );
}
