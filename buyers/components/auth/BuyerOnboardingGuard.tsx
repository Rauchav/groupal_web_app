"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { User as UserIcon, ArrowRight } from "lucide-react"
import { useIsSeller } from "@/sellers/stores/seller-store"
import { useApiGet } from "@/lib/api/use-fetch"
import { SuccessCelebration } from "@/components/success-celebration"
import { cn } from "@/lib/utils"

// Pulls the human-readable message out of a Clerk API error — these come
// back as { errors: [{ message, longMessage, code }] }, not a plain Error.
function clerkErrorMessage(err: unknown, fallback: string): string {
  const errors = (err as { errors?: { longMessage?: string; message?: string }[] })?.errors
  return errors?.[0]?.longMessage ?? errors?.[0]?.message ?? fallback
}

const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  phone:     z.string().min(6, "Phone number is required"),
})
type OnboardingForm = z.infer<typeof onboardingSchema>

// Mounted once in app/(buyers)/layout.tsx, so it runs on every buyer
// route. Real bug this fixes: an account created by manually typing an
// email + password at sign-up previously reached every buyer page with
// no name, no phone, nothing — Google/Apple sign-in at least transfers a
// name, but even that can be a blank/placeholder one, and never includes
// a phone number either way. Sellers already go through a real
// onboarding step (app/sellers/page.tsx's OnboardingStep) before they can
// use their portal at all; buyers never had an equivalent, despite the
// buyer/seller split being otherwise symmetric everywhere else in this
// app. This is that equivalent — a full-screen, non-dismissible gate
// (same visual language as SellerModeModal/SuccessCelebration) that
// blocks every buyer page, old accounts included, until first name, last
// name, and phone are all on file.
//
// Deliberately excludes a signed-in seller (useIsSeller) — a seller
// browsing the buyer portal view-only is already handled by
// SellerViewOnlyGuard, and must never also be asked to "complete a buyer
// profile" on top of that.
export function BuyerOnboardingGuard() {
  const { isSignedIn, isLoaded, user } = useUser()
  const isSeller = useIsSeller()
  const { data, loading, refetch } = useApiGet<{ phone: string | null }>(
    isSignedIn && !isSeller ? "/api/users/me" : null
  )
  // Set the instant onboarding finishes, so the check below stops treating
  // "profile now complete" as a reason to immediately unmount this guard —
  // the buyer needs to see the celebration screen first, same reasoning as
  // OnboardingStep's own justOnboarded flag on the seller side.
  const [justCompleted, setJustCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: "" },
  })

  async function onSubmit(formData: OnboardingForm) {
    if (!user) return
    setSubmitting(true)
    try {
      await user.update({ firstName: formData.firstName, lastName: formData.lastName })
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }),
      })
      if (!res.ok) throw new Error("Couldn't save your phone number, please try again.")
      refetch()
      setJustCompleted(true)
    } catch (err) {
      toast.error(err instanceof Error ? clerkErrorMessage(err, err.message) : "Something went wrong, please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Not loaded yet, signed out, or a seller (own guard handles that case)
  // — nothing to show. Also nothing to show while still waiting on the
  // first /api/users/me fetch, to avoid flashing the form for an account
  // that actually already has a phone on file.
  if (!isLoaded || !isSignedIn || isSeller || loading || !data) return null

  const needsOnboarding = !justCompleted && (!user?.firstName || !user?.lastName || !data.phone)

  if (justCompleted) {
    return (
      <SuccessCelebration
        title="Welcome to Groupal!"
        description="You're now an official member of Groupal, start joining group buys and saving massive!"
        ctaLabel="Let's start saving"
        onContinue={() => setJustCompleted(false)}
      />
    )
  }

  if (!needsOnboarding) return null

  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#002356]/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#eaad00" }}>
            <UserIcon className="h-6 w-6" style={{ color: "#002356" }} />
          </div>
          <h1 className="font-heading font-bold text-[#002356] text-xl">Complete your profile</h1>
          <p className="text-gray-500 text-sm">One quick step before you can start browsing and joining group buys.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">First name</label>
              <input
                {...register("firstName")}
                placeholder="Maria"
                className={cn(
                  "w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all",
                  "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
                  errors.firstName ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
                )}
              />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last name</label>
              <input
                {...register("lastName")}
                placeholder="García"
                className={cn(
                  "w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all",
                  "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
                  errors.lastName ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
                )}
              />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

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

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait"
            style={{ backgroundColor: "#048943" }}
            onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = "#037a3b")}
            onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = "#048943")}
          >
            {submitting ? "Saving..." : "Continue to Groupal"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </main>
  )
}
