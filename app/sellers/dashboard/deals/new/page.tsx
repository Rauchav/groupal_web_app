"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, PlusCircle, Store, Truck, X, MapPin, Flag, Globe2, Lightbulb } from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"
import { DEAL_CATEGORIES } from "@/lib/constants/categories"
import { getCategoryRule } from "@/lib/constants/category-rules"
import { CONTINENTS } from "@/lib/constants/continents"
import { REACH_SCOPE_LABEL } from "@/lib/utils/deal-reach"
import type { DealReach, DealReachScope } from "@/lib/types/deal"
import { cn } from "@/lib/utils"

const PRODUCT_CATEGORIES = DEAL_CATEGORIES.filter((c) => c !== "All")
const MAX_ADDITIONAL_IMAGES = 5 // + 1 required cover = 6 total
const MAX_DELIVERY_ZONES = 4
const MAX_REACH_VALUES = 8
const REACH_SCOPE_ICON: Record<DealReachScope, typeof MapPin> = { city: MapPin, country: Flag, continent: Globe2 }

const dealSchema = z
  .object({
    productName:        z.string().min(3, "Product name is required"),
    // Optional free-text detail beyond the name — nights/hotel/inclusions
    // for a vacation package, specs for electronics, etc. Shown to buyers
    // at checkout, the seller's own deal-detail page, and their dashboard's
    // open-deal cards; never on the compact marketplace deal cards.
    productDescription: z.string().max(2000, "Keep it under 2000 characters").optional(),
    coverImage:          z.string().url("Enter a valid image URL"),
    // Optional slots — an empty one just means "not filled in yet", not a
    // validation error; onSubmit drops any left blank.
    additionalImages: z.array(z.object({
      url: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
    })),
    category:            z.string().min(1, "Pick a category"),
    // Where this deal is available — one scope (city/country/continent) and
    // one or more values for it. reachCities/reachCountries are free-text
    // lists (like deliveryZones); reachContinents is a fixed checkbox set
    // (see lib/constants/continents.ts) since that list is small and known.
    // Only the array matching reachScope is actually used at submit time —
    // the other two stay in the form state, unused, just so switching scope
    // back and forth doesn't lose what the seller already typed.
    reachScope: z.enum(["city", "country", "continent"]),
    reachCities: z.array(z.object({ value: z.string() })),
    reachCountries: z.array(z.object({ value: z.string() })),
    reachContinents: z.array(z.string()),
    // Optional for now — a future pass makes this required, same maturity
    // path productImages/deliveryZones already went through.
    externalProductUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
    originalPrice:       z.coerce.number().positive("Enter a price above $0"),
    // No hardcoded min/max here — the real bounds are per-category
    // (lib/constants/category-rules.ts) and enforced below in
    // superRefine, since a single flat range can't express "Motors tops
    // out at 25% but Fashion goes to 65%". Kept as bare positive-number
    // checks so a wildly invalid value still fails fast with a clear
    // error even before the category lookup runs.
    maxDiscountPercent:  z.coerce.number().positive("Enter a discount above 0%"),
    maxBuyersRequired:   z.coerce.number().int().positive("Needs at least 1 buyer"),
    daysUntilDeadline:   z.coerce.number().int().positive("At least 1 day"),
    isPickup:            z.boolean(),
    pickupLocation:      z.string().optional(),
    pickupHours:         z.string().optional(),
    pickupInstructions:  z.string().optional(),
    pickupCodeRequired:  z.string().optional(),
    pickupDocuments:     z.string().optional(),
    pickupContactName:   z.string().optional(),
    pickupContactPhone:  z.string().optional(),
    pickupContactEmail:  z.string().optional(),
    // Cleared (replaced with []) whenever isPickup is toggled on, so a
    // deal never carries stale zone rows from before the seller switched
    // fulfillment methods — see toggleFulfillment below. Each row that
    // does exist is required-shaped; cardinality (1–4 rows) is enforced
    // by the add/remove buttons in the UI, not by zod.
    deliveryZones: z.array(z.object({
      label: z.string().min(1, "Zone name is required"),
      price: z.coerce.number().positive("Enter a price above $0"),
    })),
  })
  .refine(
    (data) =>
      !data.isPickup ||
      (data.pickupLocation && data.pickupHours && data.pickupInstructions &&
        data.pickupContactName && data.pickupContactPhone && data.pickupContactEmail),
    { message: "Fill in the pickup location, hours, instructions, and contact details", path: ["pickupLocation"] }
  )
  .refine(
    (data) => data.isPickup || data.deliveryZones.length > 0,
    { message: "Add at least one delivery zone", path: ["deliveryZones"] }
  )
  .refine(
    (data) => {
      if (data.reachScope === "city") return data.reachCities.some((c) => c.value.trim())
      if (data.reachScope === "country") return data.reachCountries.some((c) => c.value.trim())
      return data.reachContinents.length > 0
    },
    { message: "Add at least one value for the selected reach", path: ["reachScope"] }
  )
  // Hard guardrails per category (lib/constants/category-rules.ts) —
  // blocking, unlike the discount field's soft "recommended minimum"
  // tooltip below, which never blocks submission. Mirrored server-side in
  // POST /api/deals's own superRefine — never trust this client copy
  // alone, since a request can always bypass the browser form.
  .superRefine((data, ctx) => {
    const rule = getCategoryRule(data.category)
    if (!rule) return
    if (data.maxDiscountPercent < rule.minDiscountPercent || data.maxDiscountPercent > rule.maxDiscountPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxDiscountPercent"],
        message: `${data.category} deals must offer between ${rule.minDiscountPercent}% and ${rule.maxDiscountPercent}% max discount`,
      })
    }
    if (data.daysUntilDeadline < rule.minDurationDays || data.daysUntilDeadline > rule.maxDurationDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["daysUntilDeadline"],
        message: `${data.category} deals must run between ${rule.minDurationDays} and ${rule.maxDurationDays} days`,
      })
    }
    if (data.maxBuyersRequired < rule.minBuyersRequired || data.maxBuyersRequired > rule.maxBuyersRequired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxBuyersRequired"],
        message: `${data.category} deals need between ${rule.minBuyersRequired} and ${rule.maxBuyersRequired} buyers`,
      })
    }
  })

type DealFormInput = z.input<typeof dealSchema>
type DealForm = z.output<typeof dealSchema>

const inputClass = (hasError: boolean) =>
  cn(
    "w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all",
    "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
    hasError ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
  )

// Zod's z.string().url() only checks the string is URL-shaped — it can't
// tell a page link (unsplash.com/photos/...) from a direct image file
// (images.unsplash.com/...). This actually tries to decode the image
// client-side, the same check every live preview below does, so a bad URL
// is rejected on submit too, not just warned about.
function verifyImageLoads(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

// Small live thumbnail-or-error preview reused for the cover image and
// every additional-image slot below.
function ImagePreview({ url, failed, onError }: { url: string; failed: boolean; onError: () => void }) {
  if (!url) return null
  if (failed) {
    return (
      <p className="text-xs text-red-500 mt-2">
        Couldn&apos;t load an image from that URL, make sure it&apos;s a direct link to the image
        file, not a page link (e.g. an Unsplash photo page won&apos;t work, but its &quot;copy image
        address&quot; link will).
      </p>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- live preview of an
    // arbitrary in-progress URL; next/image's stricter loader isn't needed here.
    <img
      key={url}
      src={url}
      alt=""
      className="h-14 w-14 rounded-lg object-cover border border-gray-200 mt-2"
      onError={onError}
    />
  )
}

// Non-blocking discount guidance — shown only once the chosen discount is
// already a VALID number within the category's hard min/max (an
// out-of-range value gets its own blocking zod error instead; the two
// never show at the same time), and only while it's below that
// category's recommendedMinDiscountPercent. Purely advisory: dismissing
// it, or publishing anyway, is always allowed. Re-appears if the seller
// switches category or changes the discount back down after dismissing,
// since "dismissed for a 12% Electronics deal" shouldn't silently also
// dismiss it for a 12% Fashion deal.
function RecommendedDiscountTooltip({ category, discount }: { category: string; discount: number }) {
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => setDismissed(false), [category, discount])
  const rule = getCategoryRule(category)
  if (!rule || dismissed) return null
  if (!Number.isFinite(discount) || discount < rule.minDiscountPercent || discount > rule.maxDiscountPercent) return null
  if (discount >= rule.recommendedMinDiscountPercent) return null

  return (
    <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-[#eaad00]/40 bg-[#eaad00]/10 p-3">
      <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#eaad00" }} />
      <p className="flex-1 text-xs text-gray-700 leading-relaxed">
        We strongly recommend at least <span className="font-bold">{rule.recommendedMinDiscountPercent}%</span> for{" "}
        {category} deals to attract buyers, you can still publish at {discount}% if you prefer.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function NewSellerDealPage() {
  const router = useRouter()
  const { user } = useUser()
  const profile = useSellerProfile(user?.id)
  const [isPickup, setIsPickup] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [reachScope, setReachScope] = useState<DealReachScope>("city")

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormInput, unknown, DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      productName: "", productDescription: "", coverImage: "", additionalImages: [], category: PRODUCT_CATEGORIES[0],
      reachScope: "city", reachCities: [{ value: profile?.city ?? "" }], reachCountries: [{ value: "" }], reachContinents: [],
      externalProductUrl: "",
      originalPrice: "" as unknown as number, maxDiscountPercent: 40, maxBuyersRequired: 20,
      daysUntilDeadline: 7, isPickup: false, deliveryZones: [{ label: "", price: "" as unknown as number }],
    },
  })

  const additionalImages = useFieldArray({ control, name: "additionalImages" })
  const deliveryZones = useFieldArray({ control, name: "deliveryZones" })
  const reachCities = useFieldArray({ control, name: "reachCities" })
  const reachCountries = useFieldArray({ control, name: "reachCountries" })

  function changeReachScope(scope: DealReachScope) {
    setReachScope(scope)
    setValue("reachScope", scope)
  }

  const reachContinents = watch("reachContinents")
  function toggleContinent(continent: string) {
    const next = reachContinents.includes(continent)
      ? reachContinents.filter((c) => c !== continent)
      : [...reachContinents, continent]
    setValue("reachContinents", next)
  }

  function toggleFulfillment(pickup: boolean) {
    setIsPickup(pickup)
    setValue("isPickup", pickup)
    if (pickup) {
      deliveryZones.replace([])
    } else if (deliveryZones.fields.length === 0) {
      deliveryZones.replace([{ label: "", price: "" as unknown as number }])
    }
  }

  const watchedCategory = watch("category")
  const categoryRule = getCategoryRule(watchedCategory)
  const watchedDiscount = Number(watch("maxDiscountPercent"))

  const coverImageUrl = watch("coverImage")
  const [coverPreviewFailed, setCoverPreviewFailed] = useState(false)
  const additionalImageUrls = watch("additionalImages")
  const [failedPreviewIndexes, setFailedPreviewIndexes] = useState<Set<number>>(new Set())

  async function onSubmit(data: DealForm) {
    if (!profile || !user) return

    setPublishing(true)

    const extraUrls = data.additionalImages.map((i) => i.url).filter((url): url is string => !!url)
    const allUrls = [data.coverImage, ...extraUrls]
    const loadResults = await Promise.all(allUrls.map(verifyImageLoads))
    if (loadResults.some((ok) => !ok)) {
      setPublishing(false)
      setCoverPreviewFailed(!loadResults[0])
      setFailedPreviewIndexes(new Set(loadResults.slice(1).map((ok, i) => (ok ? -1 : i)).filter((i) => i >= 0)))
      toast.error("One of those image URLs doesn't load as an image, use a direct link to the image file, not a page link.")
      return
    }

    const reach: DealReach = {
      scope: data.reachScope,
      values:
        data.reachScope === "city" ? data.reachCities.map((c) => c.value.trim()).filter(Boolean)
        : data.reachScope === "country" ? data.reachCountries.map((c) => c.value.trim()).filter(Boolean)
        : data.reachContinents,
    }

    // Upsert-safe (POST /api/sellers), so a seller who onboarded before
    // this endpoint existed still gets a real SellerProfile row here —
    // otherwise the deal creation call below would 403 for them. Checked
    // (not fire-and-forget) so a failure here surfaces clearly instead of
    // showing up downstream as a confusing "couldn't publish" from the
    // deal-creation call that follows it.
    const sellerRes = await fetch("/api/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: profile.companyName,
        category: profile.category,
        phone: profile.phone,
        city: profile.city,
        website: profile.website || undefined,
      }),
    }).catch(() => null)

    if (!sellerRes || !sellerRes.ok) {
      setPublishing(false)
      const body = await sellerRes?.json().catch(() => null)
      console.error("Seller profile sync failed:", body)
      toast.error("Couldn't confirm your seller account before publishing, please try again.")
      return
    }

    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: data.productName,
        productDescription: data.productDescription || undefined,
        productImages: allUrls,
        category: data.category,
        reach,
        externalProductUrl: data.externalProductUrl || undefined,
        originalPrice: data.originalPrice,
        currency: "USD",
        maxDiscountPercent: data.maxDiscountPercent,
        maxBuyersRequired: data.maxBuyersRequired,
        daysUntilDeadline: data.daysUntilDeadline,
        isPickup: data.isPickup,
        pickupDetails: data.isPickup
          ? {
              location:          data.pickupLocation!,
              hours:             data.pickupHours!,
              instructions:      data.pickupInstructions!,
              codeRequired:      data.pickupCodeRequired || "Order confirmation code",
              documentsRequired: data.pickupDocuments || "Valid photo ID",
              contactName:       data.pickupContactName!,
              contactPhone:      data.pickupContactPhone!,
              contactEmail:      data.pickupContactEmail!,
            }
          : undefined,
        deliveryZones: data.isPickup ? undefined : data.deliveryZones,
      }),
    })

    if (!res.ok) {
      setPublishing(false)
      const body: { error?: string | { formErrors?: string[]; fieldErrors?: Record<string, string[]> } } | null =
        await res.json().catch(() => null)
      console.error("Deal creation failed:", body)
      const err = body?.error
      const detail =
        typeof err === "string"
          ? err
          : err?.formErrors?.[0] ?? Object.values(err?.fieldErrors ?? {})[0]?.[0]
      toast.error(detail ? `Couldn't publish that deal, ${detail}` : "Couldn't publish that deal, please try again.")
      return
    }
    const { deal: newDeal } = await res.json()

    router.push(`/sellers/dashboard/deals/published?dealId=${newDeal.id}`)
  }

  return (
    <>
      <div>
        <h1 className="font-heading font-extrabold text-[#002356] text-2xl">Create a Group Buy Deal</h1>
        <p className="text-gray-500 text-sm mt-1">
          Set a retail price, a target discount, and a closing date, Groupal handles the countdown, the
          live discount math, and the final charge.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">

        {/* Product basics */}
        <div className="space-y-4">
          <h2 className="font-heading font-bold text-[#002356] text-sm uppercase tracking-wider">Product</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Product name</label>
            <input {...register("productName")} placeholder="Samsung 65&quot; QLED 4K Smart TV" className={inputClass(!!errors.productName)} />
            {errors.productName && <p className="text-xs text-red-500 mt-1">{errors.productName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              {...register("productDescription")}
              rows={4}
              placeholder="Give buyers the details that don't fit in the name, e.g. for a vacation package: how many nights, which hotel, what's included."
              className={cn(inputClass(!!errors.productDescription), "resize-y")}
            />
            {errors.productDescription && <p className="text-xs text-red-500 mt-1">{errors.productDescription.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cover photo</label>
              <input
                {...register("coverImage", { onChange: () => setCoverPreviewFailed(false) })}
                placeholder="https://images.example.com/product.jpg"
                className={inputClass(!!errors.coverImage)}
              />
              {errors.coverImage && <p className="text-xs text-red-500 mt-1">{errors.coverImage.message}</p>}
              {!errors.coverImage && (
                <ImagePreview url={coverImageUrl} failed={coverPreviewFailed} onError={() => setCoverPreviewFailed(true)} />
              )}
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select {...register("category")} className={cn(inputClass(!!errors.category), "appearance-none cursor-pointer")}>
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Additional photos — up to 5 more, 6 total with the cover */}
          <div className="space-y-2">
            {additionalImages.fields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    {...register(`additionalImages.${i}.url`, {
                      onChange: () => setFailedPreviewIndexes((prev) => { const next = new Set(prev); next.delete(i); return next }),
                    })}
                    placeholder={`Additional photo ${i + 1} URL (optional)`}
                    className={inputClass(!!errors.additionalImages?.[i]?.url)}
                  />
                  {errors.additionalImages?.[i]?.url && (
                    <p className="text-xs text-red-500 mt-1">{errors.additionalImages[i]?.url?.message}</p>
                  )}
                  <ImagePreview
                    url={additionalImageUrls?.[i]?.url ?? ""}
                    failed={failedPreviewIndexes.has(i)}
                    onError={() => setFailedPreviewIndexes((prev) => new Set(prev).add(i))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => additionalImages.remove(i)}
                  aria-label="Remove photo"
                  className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {additionalImages.fields.length < MAX_ADDITIONAL_IMAGES && (
              <button
                type="button"
                onClick={() => additionalImages.append({ url: "" })}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 border-dashed border-[#002356]/25 text-[#002356] cursor-pointer transition-all hover:border-[#002356] hover:bg-[#002356]/5 active:scale-[0.97]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another photo ({additionalImages.fields.length + 1}/{MAX_ADDITIONAL_IMAGES + 1})
              </button>
            )}
          </div>
        </div>

        {/* Deal reach & listing */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h2 className="font-heading font-bold text-[#002356] text-sm uppercase tracking-wider">Deal Reach & Listing</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Where is this deal available? <span className="font-normal text-gray-400">(pick one, then add one or more)</span>
            </label>
            <div className="flex gap-3 mb-3">
              {(["city", "country", "continent"] as const).map((scope) => {
                const Icon = REACH_SCOPE_ICON[scope]
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => changeReachScope(scope)}
                    className={cn(
                      "flex-1 flex items-center gap-2 justify-center py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer",
                      reachScope === scope ? "border-[#002356] bg-[#002356] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    <Icon className="h-4 w-4" /> {REACH_SCOPE_LABEL[scope]}
                  </button>
                )
              })}
            </div>

            {reachScope !== "continent" ? (
              <div className="space-y-2">
                {(reachScope === "city" ? reachCities : reachCountries).fields.map((field, i) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <input
                      {...register(reachScope === "city" ? `reachCities.${i}.value` : `reachCountries.${i}.value`)}
                      placeholder={reachScope === "city" ? "e.g. Starnberg" : "e.g. Germany"}
                      className={cn(inputClass(false), "flex-1")}
                    />
                    <button
                      type="button"
                      onClick={() => (reachScope === "city" ? reachCities : reachCountries).remove(i)}
                      disabled={(reachScope === "city" ? reachCities : reachCountries).fields.length <= 1}
                      aria-label="Remove"
                      className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {(reachScope === "city" ? reachCities : reachCountries).fields.length < MAX_REACH_VALUES && (
                  <button
                    type="button"
                    onClick={() => (reachScope === "city" ? reachCities : reachCountries).append({ value: "" })}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 border-dashed border-[#002356]/25 text-[#002356] cursor-pointer transition-all hover:border-[#002356] hover:bg-[#002356]/5 active:scale-[0.97]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add another {reachScope}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CONTINENTS.map((c) => (
                  <label
                    key={c}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors",
                      reachContinents.includes(c) ? "border-[#002356] bg-[#002356]/5 text-[#002356]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={reachContinents.includes(c)}
                      onChange={() => toggleContinent(c)}
                      className="h-4 w-4 accent-[#002356] cursor-pointer"
                    />
                    {c}
                  </label>
                ))}
              </div>
            )}
            {errors.reachScope && <p className="text-xs text-red-500 mt-2">{errors.reachScope.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Product page link <span className="font-normal text-gray-400">(optional for now)</span>
            </label>
            <input
              {...register("externalProductUrl")}
              placeholder="https://your-store.com/products/this-item"
              className={inputClass(!!errors.externalProductUrl)}
            />
            {errors.externalProductUrl && <p className="text-xs text-red-500 mt-1">{errors.externalProductUrl.message}</p>}
            <p className="text-xs text-gray-400 mt-1">
              A deep link to this product on your own website or marketplace listing, lets buyers see the
              original page (reviews, full specs) alongside the group deal. Optional for now; a future update
              will require it.
            </p>
          </div>
        </div>

        {/* Pricing & group terms */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h2 className="font-heading font-bold text-[#002356] text-sm uppercase tracking-wider">Pricing & Group Terms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Store price ($)</label>
              <input type="number" step="0.01" {...register("originalPrice")} placeholder="1799" className={inputClass(!!errors.originalPrice)} />
              {errors.originalPrice && <p className="text-xs text-red-500 mt-1">{errors.originalPrice.message}</p>}
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Max discount (%)</label>
              {categoryRule && (
                <p className="text-xs text-gray-400 mb-1">
                  {categoryRule.minDiscountPercent}–{categoryRule.maxDiscountPercent}% for {watchedCategory}
                </p>
              )}
              <input type="number" {...register("maxDiscountPercent")} className={inputClass(!!errors.maxDiscountPercent)} />
              {errors.maxDiscountPercent && <p className="text-xs text-red-500 mt-1">{errors.maxDiscountPercent.message}</p>}
              {!errors.maxDiscountPercent && (
                <RecommendedDiscountTooltip category={watchedCategory} discount={watchedDiscount} />
              )}
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Max buyers</label>
              {categoryRule && (
                <p className="text-xs text-gray-400 mb-1">
                  {categoryRule.minBuyersRequired}–{categoryRule.maxBuyersRequired} for {watchedCategory}
                </p>
              )}
              <input type="number" {...register("maxBuyersRequired")} className={inputClass(!!errors.maxBuyersRequired)} />
              {errors.maxBuyersRequired && <p className="text-xs text-red-500 mt-1">{errors.maxBuyersRequired.message}</p>}
            </div>
          </div>
          <div className="sm:w-1/3 min-w-0">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Closes in (days)</label>
            {categoryRule && (
              <p className="text-xs text-gray-400 mb-1">
                {categoryRule.minDurationDays}–{categoryRule.maxDurationDays} days for {watchedCategory}
              </p>
            )}
            <input type="number" {...register("daysUntilDeadline")} className={inputClass(!!errors.daysUntilDeadline)} />
            {errors.daysUntilDeadline && <p className="text-xs text-red-500 mt-1">{errors.daysUntilDeadline.message}</p>}
          </div>
          <p className="text-xs text-gray-400">
            The 10% upfront reservation is fixed platform-wide and calculated automatically from the store
            price, it&apos;s not something you set here.
          </p>
        </div>

        {/* Fulfillment */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h2 className="font-heading font-bold text-[#002356] text-sm uppercase tracking-wider">Fulfillment</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => toggleFulfillment(false)}
              className={cn(
                "flex-1 flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-bold border transition-colors cursor-pointer",
                !isPickup ? "border-[#002356] bg-[#002356] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"
              )}
            >
              <Truck className="h-4 w-4" /> Delivered
            </button>
            <button
              type="button"
              onClick={() => toggleFulfillment(true)}
              className={cn(
                "flex-1 flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-bold border transition-colors cursor-pointer",
                isPickup ? "border-[#002356] bg-[#002356] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"
              )}
            >
              <Store className="h-4 w-4" /> In-Store Pickup
            </button>
          </div>

          {!isPickup && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Delivery zones <span className="font-normal text-gray-400">(1 to {MAX_DELIVERY_ZONES}, flat rate per zone)</span>
              </label>
              {deliveryZones.fields.map((field, i) => (
                <div key={field.id} className="flex items-start gap-2">
                  <input
                    {...register(`deliveryZones.${i}.label`)}
                    placeholder="Zone name, e.g. Downtown"
                    className={cn(inputClass(!!errors.deliveryZones?.[i]?.label), "flex-1")}
                  />
                  <div className="w-28 flex-shrink-0">
                    <input
                      type="number"
                      step="0.01"
                      {...register(`deliveryZones.${i}.price`)}
                      placeholder="$10"
                      className={inputClass(!!errors.deliveryZones?.[i]?.price)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => deliveryZones.remove(i)}
                    disabled={deliveryZones.fields.length <= 1}
                    aria-label="Remove zone"
                    className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {(errors.deliveryZones?.[0]?.label || errors.deliveryZones?.[0]?.price) && (
                <p className="text-xs text-red-500">Give each zone a name and a price above $0.</p>
              )}
              {deliveryZones.fields.length < MAX_DELIVERY_ZONES && (
                <button
                  type="button"
                  onClick={() => deliveryZones.append({ label: "", price: "" as unknown as number })}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 border-dashed border-[#002356]/25 text-[#002356] cursor-pointer transition-all hover:border-[#002356] hover:bg-[#002356]/5 active:scale-[0.97]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add delivery zone ({deliveryZones.fields.length}/{MAX_DELIVERY_ZONES})
                </button>
              )}
            </div>
          )}

          {isPickup && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup location</label>
                <input {...register("pickupLocation")} placeholder="123 Main St, La Paz" className={inputClass(!!errors.pickupLocation)} />
                {errors.pickupLocation && <p className="text-xs text-red-500 mt-1">{errors.pickupLocation.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup hours</label>
                <input {...register("pickupHours")} placeholder="Mon–Sat, 9:00 AM – 6:00 PM" className={inputClass(false)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Documents required</label>
                <input {...register("pickupDocuments")} placeholder="Valid photo ID" className={inputClass(false)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup instructions</label>
                <input {...register("pickupInstructions")} placeholder="Show your order confirmation at the counter" className={inputClass(false)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact name</label>
                <input {...register("pickupContactName")} className={inputClass(false)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact phone</label>
                <input {...register("pickupContactPhone")} className={inputClass(false)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact email</label>
                <input {...register("pickupContactEmail")} className={inputClass(false)} />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={publishing}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#048943" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#037a3b")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#048943")}
        >
          <PlusCircle className="h-4 w-4" />
          {publishing ? "Checking photos..." : "Publish Group Buy Deal"}
        </button>
      </form>
    </>
  )
}
