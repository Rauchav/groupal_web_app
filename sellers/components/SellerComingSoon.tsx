import type { LucideIcon } from "lucide-react"

// Shared placeholder for seller dashboard sections not yet built out —
// keeps the nav shell fully clickable (no dead links, no broken nested
// <main> tags) while each section gets its real implementation in a later
// phase. Renders as a fragment, not a page wrapper — the parent
// SellerDashboardLayout (app/sellers/dashboard/layout.tsx) already
// supplies the <main>/padding/sidebar shell.
export function SellerComingSoon({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="flex justify-center mb-4">
        <Icon className="h-14 w-14 text-gray-200" />
      </div>
      <h1 className="font-heading font-bold text-gray-700 text-lg mb-1">{title}</h1>
      <p className="text-gray-400 text-sm max-w-sm mx-auto">{description}</p>
    </div>
  )
}
