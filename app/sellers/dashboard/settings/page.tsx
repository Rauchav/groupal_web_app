"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Building2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useSellerStore, useSellerProfile } from "@/sellers/stores/seller-store"
import { DEAL_CATEGORIES } from "@/lib/constants/categories"
import { cn } from "@/lib/utils"

const COMPANY_CATEGORIES = DEAL_CATEGORIES.filter((c) => c !== "All")

const companySchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  category:    z.string().min(1, "Pick a category"),
  phone:       z.string().min(6, "Phone number is required"),
  city:        z.string().min(2, "City is required"),
  website:     z.string().url("Enter a valid URL, e.g. https://acme.com").optional().or(z.literal("")),
  description: z.string().optional(),
})
type CompanyForm = z.infer<typeof companySchema>

export default function SellerSettingsPage() {
  const { user } = useUser()
  const profile = useSellerProfile(user?.id)
  const updateProfile = useSellerStore((s) => s.updateProfile)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: profile?.companyName ?? "",
      category:    profile?.category ?? COMPANY_CATEGORIES[0],
      phone:       profile?.phone ?? "",
      city:        profile?.city ?? "",
      website:     profile?.website ?? "",
      description: profile?.description ?? "",
    },
  })

  function onSubmit(data: CompanyForm) {
    if (!user) return
    updateProfile(user.id, { ...data, website: data.website || undefined })
    toast.success("Company profile updated!")
  }

  return (
    <>
      <div>
        <h1 className="font-heading font-extrabold text-[#002356] text-2xl">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your company profile.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#eaad00" }}>
              <Building2 className="h-7 w-7" style={{ color: "#002356" }} />
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-sm">{profile?.companyName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {profile?.verified ? "Verified seller" : "Verification pending"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company name</label>
              <input
                {...register("companyName")}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all",
                  "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
                  errors.companyName ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
                )}
              />
              {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Primary category</label>
              <select
                {...register("category")}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356] appearance-none cursor-pointer"
              >
                {COMPANY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone number</label>
              <input
                {...register("phone")}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all",
                  "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
                  errors.phone ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
                )}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input
                {...register("city")}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all",
                  "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
                  errors.city ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
                )}
              />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Website <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              {...register("website")}
              placeholder="https://acme.com"
              className={cn(
                "w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all",
                "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
                errors.website ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
              )}
            />
            {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              About your company <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="A short description buyers will see on your offers."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356] transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl font-bold text-white text-sm cursor-pointer transition-colors"
            style={{ backgroundColor: "#048943" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#037a3b")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#048943")}
          >
            Save Changes
          </button>
        </form>
      </div>
    </>
  )
}
