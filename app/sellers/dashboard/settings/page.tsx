"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Building2, Mail, ShieldCheck, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useSellerStore, useSellerProfile } from "@/sellers/stores/seller-store"
import { DEAL_CATEGORIES } from "@/lib/constants/categories"
import { cn } from "@/lib/utils"

// Pulls the human-readable message out of a Clerk API error — these come
// back as { errors: [{ message, longMessage, code }] }, not a plain Error.
function clerkErrorMessage(err: unknown, fallback: string): string {
  const errors = (err as { errors?: { longMessage?: string; message?: string }[] })?.errors
  return errors?.[0]?.longMessage ?? errors?.[0]?.message ?? fallback
}

// Real Clerk account-security flow — not mocked, unlike the rest of this
// app's payment/deal data. Clerk already owns the seller's identity
// (Google/Apple sign-in), so changing the address they're reachable at
// goes through Clerk's own create → email-code verify → set-as-primary
// APIs rather than a fake confirmation step. The previous email is left in
// place as a secondary identifier (not deleted) — only which one is
// PRIMARY changes, so nothing about how they originally signed in breaks.
// Derived from useUser() itself rather than imported from @clerk/types
// (not a direct dependency of this project) — the exact shape returned by
// user.createEmailAddress().
type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>
type ClerkEmailAddress = Awaited<ReturnType<ClerkUser["createEmailAddress"]>>

function EmailSection() {
  const { user } = useUser()
  const [step, setStep] = useState<"view" | "enter-email" | "enter-code">("view")
  const [newEmail, setNewEmail] = useState("")
  const [code, setCode] = useState("")
  const [pendingEmail, setPendingEmail] = useState<ClerkEmailAddress | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const currentEmail = user?.primaryEmailAddress?.emailAddress ?? ""

  function resetToView() {
    setStep("view")
    setNewEmail("")
    setCode("")
    setPendingEmail(null)
  }

  async function cancelPending() {
    if (pendingEmail) {
      try {
        await pendingEmail.destroy()
      } catch {
        // Already gone or never fully created — fine to ignore on cancel.
      }
    }
    resetToView()
  }

  async function handleSendCode() {
    if (!user) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Enter a valid email address.")
      return
    }
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error("That's already your current email.")
      return
    }

    setSubmitting(true)
    try {
      const emailAddress = await user.createEmailAddress({ email: newEmail })
      await emailAddress.prepareVerification({ strategy: "email_code" })
      setPendingEmail(emailAddress)
      setStep("enter-code")
      toast.success(`Verification code sent to ${newEmail}`)
    } catch (err) {
      toast.error(clerkErrorMessage(err, "Couldn't send a verification code to that address."))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (!pendingEmail) return
    setSubmitting(true)
    try {
      await pendingEmail.prepareVerification({ strategy: "email_code" })
      toast.success(`Verification code resent to ${newEmail}`)
    } catch (err) {
      toast.error(clerkErrorMessage(err, "Couldn't resend the code — try again."))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerify() {
    if (!user || !pendingEmail) return
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code from your email.")
      return
    }

    setSubmitting(true)
    try {
      const verified = await pendingEmail.attemptVerification({ code })
      await user.update({ primaryEmailAddressId: verified.id })
      await user.reload()
      toast.success("Email updated!")
      resetToView()
    } catch (err) {
      toast.error(clerkErrorMessage(err, "That code didn't match — check it and try again."))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    "w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356] transition-all"

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Account email</label>

      {step === "view" && (
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-xl border border-gray-200 bg-gray-100">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">{currentEmail}</span>
          </div>
          <button
            type="button"
            onClick={() => setStep("enter-email")}
            className="flex-shrink-0 text-sm font-bold cursor-pointer transition-colors"
            style={{ color: "#002356" }}
          >
            Change email
          </button>
        </div>
      )}

      {step === "enter-email" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="email"
              autoFocus
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new-email@company.com"
              className={inputClass}
            />
            <button
              type="button"
              onClick={cancelPending}
              aria-label="Cancel"
              className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            We&apos;ll send a 6-digit code to confirm you own this address before it becomes your account email.
          </p>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSendCode}
            className="px-4 py-2 rounded-xl font-bold text-white text-xs cursor-pointer transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#002356" }}
          >
            {submitting ? "Sending..." : "Send verification code"}
          </button>
        </div>
      )}

      {step === "enter-code" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: "#048943" }} />
            Enter the code sent to <span className="font-semibold text-gray-700">{newEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className={cn(inputClass, "tracking-[0.3em] font-mono text-center max-w-[9rem]")}
            />
            <button
              type="button"
              disabled={submitting}
              onClick={handleVerify}
              className="px-4 py-2.5 rounded-xl font-bold text-white text-xs cursor-pointer transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#048943" }}
            >
              {submitting ? "Verifying..." : "Verify & Update"}
            </button>
            <button
              type="button"
              onClick={cancelPending}
              aria-label="Cancel"
              className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleResendCode}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer disabled:opacity-50"
          >
            Didn&apos;t get it? Resend code
          </button>
        </div>
      )}
    </div>
  )
}

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

          <div className="space-y-4 pt-1 pb-1 border-t border-gray-100">
            <h2 className="font-heading font-bold text-[#002356] text-sm uppercase tracking-wider pt-4">Account</h2>
            <EmailSection />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="sm:col-span-2">
              <h2 className="font-heading font-bold text-[#002356] text-sm uppercase tracking-wider mb-1">Company</h2>
            </div>
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
              placeholder="A short description buyers will see on your deals."
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
