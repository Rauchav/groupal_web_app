"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUser, SignIn, SignUp } from "@clerk/nextjs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Building2, ArrowRight } from "lucide-react"
import { useSellerStore, useSellerProfile } from "@/sellers/stores/seller-store"
import { DEAL_CATEGORIES } from "@/lib/constants/categories"
import { cn } from "@/lib/utils"

// Shared appearance for both the sign-in and sign-up widgets — same
// treatment as app/sign-in and app/sign-up so switching between the buyer
// and seller auth screens feels like the same platform, not a bolt-on.
const CLERK_APPEARANCE = {
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "mx-auto",
    card: "shadow-2xl rounded-2xl",
    headerTitle: "text-[#002356] font-bold",
    formButtonPrimary: "bg-[#048943] hover:bg-[#037a3b] text-white",
    footerActionLink: "text-[#002356] hover:text-[#1b4487]",
  },
}

const onboardingSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  category:    z.string().min(1, "Pick a category"),
  phone:       z.string().min(6, "Phone number is required"),
  city:        z.string().min(2, "City is required"),
  website:     z.string().url("Enter a valid URL, e.g. https://acme.com").optional().or(z.literal("")),
})
type OnboardingForm = z.infer<typeof onboardingSchema>

// The company categories reuse the buyer marketplace's categories minus
// "All" — a seller's primary category, not a filter.
const COMPANY_CATEGORIES = DEAL_CATEGORIES.filter((c) => c !== "All")

function OnboardingStep({ userId }: { userId: string }) {
  const router = useRouter()
  const createProfile = useSellerStore((s) => s.createProfile)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { companyName: "", category: COMPANY_CATEGORIES[0], phone: "", city: "", website: "" },
  })

  function onSubmit(data: OnboardingForm) {
    createProfile({
      userId,
      companyName: data.companyName,
      category:    data.category,
      phone:       data.phone,
      city:        data.city,
      website:     data.website || undefined,
    })
    toast.success("Welcome to Groupal for Business!")
    router.push("/sellers/dashboard")
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-1.5">
        <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#eaad00" }}>
          <Building2 className="h-6 w-6" style={{ color: "#002356" }} />
        </div>
        <h1 className="font-heading font-bold text-[#002356] text-xl">Tell us about your company</h1>
        <p className="text-gray-500 text-sm">One quick step before you can create your first group buy offer.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Company name</label>
          <input
            {...register("companyName")}
            placeholder="Acme Electronics"
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
          <div className="relative">
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
              placeholder="+591 70000000"
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
              placeholder="La Paz"
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

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm cursor-pointer transition-colors"
          style={{ backgroundColor: "#048943" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#037a3b")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#048943")}
        >
          Continue to dashboard
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

export default function SellersGatePage() {
  const router = useRouter()
  const { isSignedIn, isLoaded, user } = useUser()
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in")
  const profile      = useSellerProfile(user?.id)
  const hasHydrated  = useSellerStore((s) => s.hasHydrated)

  useEffect(() => {
    if (isSignedIn && hasHydrated && profile) {
      router.replace("/sellers/dashboard")
    }
  }, [isSignedIn, hasHydrated, profile, router])

  // Avoid flashing the sign-in form for a split second while Clerk/the
  // store are still loading, or the onboarding form while we're about to
  // redirect an already-onboarded seller to their dashboard.
  if (!isLoaded || !hasHydrated || (isSignedIn && profile)) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#002356" }}>
        <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center pt-28 pb-12 px-4" style={{ backgroundColor: "#002356" }}>
      <div className="text-center mb-8">
        <img src="/brand/isologo fondo azul.svg" alt="Groupal" className="h-16 mx-auto mb-4" />
        <p className="font-heading font-bold text-white/70 text-sm">Groupal for Business</p>
      </div>

      {isSignedIn && user ? (
        <OnboardingStep userId={user.id} />
      ) : (
        <div className="w-full max-w-md space-y-5">
          <p className="text-center text-white/70 text-sm max-w-sm mx-auto">
            Create group buy offers, reach thousands of ready-to-buy customers, and move inventory fast.{" "}
            <Link href="/sellers/docs" className="font-bold text-[#eaad00] hover:underline">
              See how it works →
            </Link>
          </p>

          <div className="flex items-center gap-1.5 bg-white/10 rounded-xl p-1 max-w-xs mx-auto">
            <button
              onClick={() => setAuthMode("sign-in")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer",
                authMode === "sign-in" ? "bg-white text-[#002356]" : "text-white/70 hover:text-white"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode("sign-up")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer",
                authMode === "sign-up" ? "bg-white text-[#002356]" : "text-white/70 hover:text-white"
              )}
            >
              Create Account
            </button>
          </div>

          {authMode === "sign-in" ? (
            <SignIn routing="hash" signUpUrl="/sellers" fallbackRedirectUrl="/sellers" appearance={CLERK_APPEARANCE} />
          ) : (
            <SignUp routing="hash" signInUrl="/sellers" fallbackRedirectUrl="/sellers" appearance={CLERK_APPEARANCE} />
          )}
        </div>
      )}
    </main>
  )
}
