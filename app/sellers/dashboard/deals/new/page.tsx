"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, PlusCircle, Store, Truck, X } from "lucide-react"
import { useSellerProfile } from "@/sellers/stores/seller-store"
import { useSellerDealsStore } from "@/sellers/stores/seller-deals-store"
import { daysFromNow, milestones } from "@/lib/mock/deals"
import { DEAL_CATEGORIES } from "@/lib/constants/categories"
import { cn } from "@/lib/utils"

const PRODUCT_CATEGORIES = DEAL_CATEGORIES.filter((c) => c !== "All")
const MAX_ADDITIONAL_IMAGES = 5 // + 1 required cover = 6 total
const MAX_DELIVERY_ZONES = 4

const dealSchema = z
  .object({
    productName:        z.string().min(3, "Product name is required"),
    coverImage:          z.string().url("Enter a valid image URL"),
    // Optional slots — an empty one just means "not filled in yet", not a
    // validation error; onSubmit drops any left blank.
    additionalImages: z.array(z.object({
      url: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
    })),
    category:            z.string().min(1, "Pick a category"),
    originalPrice:       z.coerce.number().positive("Enter a price above $0"),
    maxDiscountPercent:  z.coerce.number().min(5, "At least 5%").max(90, "Keep it under 90%"),
    maxBuyersRequired:   z.coerce.number().int().min(2, "Needs at least 2 buyers"),
    daysUntilDeadline:   z.coerce.number().int().min(1, "At least 1 day").max(60, "60 days max"),
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
        Couldn&apos;t load an image from that URL — make sure it&apos;s a direct link to the image
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

export default function NewSellerDealPage() {
  const router = useRouter()
  const { user } = useUser()
  const profile = useSellerProfile(user?.id)
  const addDeal = useSellerDealsStore((s) => s.addDeal)
  const [isPickup, setIsPickup] = useState(false)
  const [publishing, setPublishing] = useState(false)

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
      productName: "", coverImage: "", additionalImages: [], category: PRODUCT_CATEGORIES[0],
      originalPrice: "" as unknown as number, maxDiscountPercent: 40, maxBuyersRequired: 20,
      daysUntilDeadline: 7, isPickup: false, deliveryZones: [{ label: "", price: "" as unknown as number }],
    },
  })

  const additionalImages = useFieldArray({ control, name: "additionalImages" })
  const deliveryZones = useFieldArray({ control, name: "deliveryZones" })

  function toggleFulfillment(pickup: boolean) {
    setIsPickup(pickup)
    setValue("isPickup", pickup)
    if (pickup) {
      deliveryZones.replace([])
    } else if (deliveryZones.fields.length === 0) {
      deliveryZones.replace([{ label: "", price: "" as unknown as number }])
    }
  }

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
      toast.error("One of those image URLs doesn't load as an image — use a direct link to the image file, not a page link.")
      return
    }

    const newDealId = `deal_${Date.now().toString(36)}`
    addDeal({
      id:                    newDealId,
      sellerId:              profile.id,
      sellerUserId:          user.id,
      sellerName:            profile.companyName,
      sellerVerified:        profile.verified,
      productName:           data.productName,
      productImages:         allUrls,
      category:              data.category,
      originalPrice:         data.originalPrice,
      currency:              "USD",
      maxDiscountPercent:    data.maxDiscountPercent,
      maxBuyersRequired:     data.maxBuyersRequired,
      currentBuyerCount:     0,
      deadlineAt:            daysFromNow(data.daysUntilDeadline),
      milestones:            milestones(data.maxBuyersRequired, data.maxDiscountPercent),
      reservationFeePercent: 10,
      isPickup:              data.isPickup,
      pickupDetails: data.isPickup
        ? {
            location:         data.pickupLocation!,
            hours:            data.pickupHours!,
            instructions:     data.pickupInstructions!,
            codeRequired:     data.pickupCodeRequired || "Order confirmation code",
            documentsRequired: data.pickupDocuments || "Valid photo ID",
            contactName:      data.pickupContactName!,
            contactPhone:     data.pickupContactPhone!,
            contactEmail:     data.pickupContactEmail!,
          }
        : undefined,
      deliveryZones: data.isPickup ? undefined : data.deliveryZones,
      status:    "active",
      createdAt: new Date(),
    })

    router.push(`/sellers/dashboard/deals/published?dealId=${newDealId}`)
  }

  return (
    <>
      <div>
        <h1 className="font-heading font-extrabold text-[#002356] text-2xl">Create a Group Buy Deal</h1>
        <p className="text-gray-500 text-sm mt-1">
          Set a retail price, a target discount, and a closing date — Groupal handles the countdown, the
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
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
            <div>
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

        {/* Pricing & group terms */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h2 className="font-heading font-bold text-[#002356] text-sm uppercase tracking-wider">Pricing & Group Terms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Store price ($)</label>
              <input type="number" step="0.01" {...register("originalPrice")} placeholder="1799" className={inputClass(!!errors.originalPrice)} />
              {errors.originalPrice && <p className="text-xs text-red-500 mt-1">{errors.originalPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Max discount (%)</label>
              <input type="number" {...register("maxDiscountPercent")} className={inputClass(!!errors.maxDiscountPercent)} />
              {errors.maxDiscountPercent && <p className="text-xs text-red-500 mt-1">{errors.maxDiscountPercent.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Max buyers</label>
              <input type="number" {...register("maxBuyersRequired")} className={inputClass(!!errors.maxBuyersRequired)} />
              {errors.maxBuyersRequired && <p className="text-xs text-red-500 mt-1">{errors.maxBuyersRequired.message}</p>}
            </div>
          </div>
          <div className="sm:w-1/3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Closes in (days)</label>
            <input type="number" {...register("daysUntilDeadline")} className={inputClass(!!errors.daysUntilDeadline)} />
            {errors.daysUntilDeadline && <p className="text-xs text-red-500 mt-1">{errors.daysUntilDeadline.message}</p>}
          </div>
          <p className="text-xs text-gray-400">
            The 10% upfront reservation is fixed platform-wide and calculated automatically from the store
            price — it&apos;s not something you set here.
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
