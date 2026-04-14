"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  ShoppingBag, Heart, Settings, LayoutList,
  ShoppingCart, CreditCard, User, Bell, Lock,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { usePreferencesStore } from "@/lib/stores/preferences-store"
import { cn } from "@/lib/utils"

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ active }: { active: string }) {
  const items = [
    { href: "/dashboard",            icon: ShoppingBag, label: "My Group Buys" },
    { href: "/dashboard/liked",      icon: Heart,       label: "Liked Deals" },
    { href: "/dashboard/purchases",  icon: LayoutList,  label: "Purchases" },
    { href: "/dashboard/settings",   icon: Settings,    label: "Settings" },
  ]
  return (
    <aside className="hidden lg:flex flex-col w-60 flex-shrink-0">
      <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {items.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors ${
              active === href
                ? "bg-[#002356] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
        <div className="border-t border-gray-100">
          <Link
            href="/deals"
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
            Back to Marketplace
          </Link>
        </div>
      </nav>
    </aside>
  )
}

function MobileTabs({ active }: { active: string }) {
  const tabs = [
    { href: "/dashboard",           label: "Buys" },
    { href: "/dashboard/liked",     label: "Liked" },
    { href: "/dashboard/purchases", label: "Purchases" },
    { href: "/dashboard/settings",  label: "Settings" },
  ]
  return (
    <div className="flex lg:hidden gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 mb-4 overflow-x-auto">
      {tabs.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`flex-1 text-center py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap px-3 ${
            active === href
              ? "bg-[#002356] text-white"
              : "text-gray-500 hover:text-[#002356]"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

// ── Profile tab ───────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  phone:     z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

function ProfileTab() {
  const { user } = useUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName:  user?.lastName  ?? "",
      phone:     "",
    },
  })

  function onSubmit(_data: ProfileForm) {
    toast.success("Profile updated!")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full overflow-hidden bg-[#eaad00] flex items-center justify-center flex-shrink-0">
          {user?.imageUrl ? (
            <Image src={user.imageUrl} alt="Profile" width={64} height={64} className="object-cover" />
          ) : (
            <span className="text-[#002356] font-extrabold text-xl">
              {user?.firstName?.[0] ?? "U"}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-700 text-sm">Profile Picture</p>
          <p className="text-xs text-gray-400 mt-0.5">Managed by your sign-in provider</p>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { id: "firstName" as const, label: "First Name", placeholder: "Maria" },
          { id: "lastName"  as const, label: "Last Name",  placeholder: "García" },
        ].map(({ id, label, placeholder }) => (
          <div key={id}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            <input
              {...register(id)}
              placeholder={placeholder}
              className={cn(
                "w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all",
                "focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356]",
                errors[id] ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
              )}
            />
            {errors[id] && (
              <p className="text-xs text-red-500 mt-1">{errors[id]?.message as string}</p>
            )}
          </div>
        ))}
      </div>

      {/* Email — readonly */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Email
          <span className="ml-2 text-xs font-normal text-gray-400">(managed by your sign-in provider)</span>
        </label>
        <input
          readOnly
          value={user?.emailAddresses?.[0]?.emailAddress ?? ""}
          className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-100 text-sm text-gray-400 outline-none"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
        <input
          {...register("phone")}
          placeholder="+591 70000000"
          className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#002356]/20 focus:border-[#002356] transition-all"
        />
      </div>

      <button
        type="submit"
        className="px-6 py-3 rounded-xl font-bold text-white text-sm cursor-pointer transition-colors"
        style={{ backgroundColor: "#048943" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#059c4f")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#048943")}
      >
        Save Changes
      </button>
    </form>
  )
}

// ── Payment methods tab ───────────────────────────────────────────────────────

function PaymentTab() {
  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <Lock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Your payment methods are securely stored and managed. We never store your full card details.
        </p>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="flex justify-center mb-4">
          <CreditCard className="h-14 w-14 text-gray-200" />
        </div>
        <h3 className="font-bold text-gray-700 mb-1">No payment methods yet</h3>
        <p className="text-gray-400 text-sm mb-5">
          Add a card to speed up checkout for future group buys.
        </p>
        <div className="relative group inline-block">
          <button
            disabled
            className="px-6 py-3 rounded-xl font-bold text-sm bg-gray-200 text-gray-400 cursor-not-allowed"
          >
            Add Payment Method
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
            <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap">
              Payment integration coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Notifications tab ─────────────────────────────────────────────────────────

type NotifKey =
  | "emailNewBuyer"
  | "emailEndingSoon"
  | "emailDealCompleted"
  | "emailPaymentReminders"
  | "pushBuyerUpdates"
  | "pushCountdownAlerts"

function NotificationsTab() {
  const { notifications, setNotification } = usePreferencesStore()

  function handleToggle(key: NotifKey, value: boolean) {
    setNotification(key, value)
    toast.success("Preferences updated!")
  }

  const emailToggles: { key: NotifKey; label: string; desc: string }[] = [
    { key: "emailNewBuyer",         label: "New buyer joined your deal",  desc: "Get notified when someone joins a deal you're in" },
    { key: "emailEndingSoon",       label: "Deal ending soon (24 hours)", desc: "Reminder before your deal closes" },
    { key: "emailDealCompleted",    label: "Deal completed",              desc: "Confirmation when your group buy closes" },
    { key: "emailPaymentReminders", label: "Payment reminders",           desc: "Reminders about upcoming final payments" },
  ]

  const pushToggles: { key: NotifKey; label: string; desc: string }[] = [
    { key: "pushBuyerUpdates",    label: "Real-time buyer updates",   desc: "Instant alerts when buyers join your deals" },
    { key: "pushCountdownAlerts", label: "Countdown alerts",          desc: "Push notifications for deal countdown" },
  ]

  return (
    <div className="space-y-6">
      {/* Email */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-[#002356] text-sm">Email Notifications</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {emailToggles.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
              <div>
                <p className="font-semibold text-gray-700 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={notifications[key]}
                onCheckedChange={(v) => handleToggle(key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Push */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-[#002356] text-sm">Push Notifications</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {pushToggles.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
              <div>
                <p className="font-semibold text-gray-700 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={notifications[key]}
                onCheckedChange={(v) => handleToggle(key, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active:  boolean
  onClick: () => void
  icon:    React.ElementType
  label:   string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer",
        active
          ? "bg-[#002356] text-white"
          : "text-gray-500 hover:text-[#002356] hover:bg-gray-100"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardSettingsPage() {
  const [tab, setTab] = useState<"profile" | "payment" | "notifications">("profile")

  return (
    <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="max-w-[1100px] mx-auto px-4">
        <MobileTabs active="/dashboard/settings" />

        <div className="flex gap-6">
          <Sidebar active="/dashboard/settings" />

          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-[#002356] text-2xl">Settings</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your profile, payment methods, and preferences.</p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
              <TabBtn active={tab === "profile"}       onClick={() => setTab("profile")}       icon={User}     label="Profile"          />
              <TabBtn active={tab === "payment"}       onClick={() => setTab("payment")}       icon={CreditCard} label="Payment Methods" />
              <TabBtn active={tab === "notifications"} onClick={() => setTab("notifications")} icon={Bell}     label="Notifications"    />
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              {tab === "profile"       && <ProfileTab />}
              {tab === "payment"       && <PaymentTab />}
              {tab === "notifications" && <NotificationsTab />}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
