// A deal's CURRENT discount (computeDealValues().currentDiscountPercent)
// must clear this bar for either marketing trigger in lib/email/send.ts
// to fire — "huge discounts" per the feature's own framing, not every
// deal. First-pass number, same "expected to change once real numbers
// come in" spirit as lib/constants/category-rules.ts.
export const MARKETING_DISCOUNT_THRESHOLD_PERCENT = 30
