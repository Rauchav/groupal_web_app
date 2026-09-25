"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Share2, Copy, Upload } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Contact {
  name: string
  email?: string
  phone?: string
}

// Deliberately simple, dependency-free CSV reader — good enough for a
// seller's own small customer list (name, email, phone columns, no
// quoted-comma edge cases). Swap for a real CSV library if sellers start
// uploading exports with quoted/escaped fields.
function parseCsv(text: string): Contact[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const nameIdx  = headers.indexOf("name")
  const emailIdx = headers.indexOf("email")
  const phoneIdx = headers.indexOf("phone")
  return lines
    .slice(1)
    .map((line) => {
      const cells = line.split(",").map((c) => c.trim())
      return {
        name:  (nameIdx >= 0 ? cells[nameIdx] : cells[0]) ?? "",
        email: emailIdx >= 0 ? cells[emailIdx] : undefined,
        phone: phoneIdx >= 0 ? cells[phoneIdx] : undefined,
      }
    })
    .filter((c) => c.name)
}

type Channel = "sms" | "email" | "whatsapp"
const CHANNELS: { key: Channel; label: string }[] = [
  { key: "sms",      label: "SMS" },
  { key: "email",    label: "Email" },
  { key: "whatsapp", label: "WhatsApp" },
]

// Opened from the seller deal-detail page's "Share this deal" button
// (app/sellers/dashboard/deals/[id]/page.tsx). Two ways to spread the
// word: the real, functional social-share links already used on the
// buyer checkout page (WhatsApp/X/copy link — genuinely opens a share
// intent or copies the real clipboard), and a bulk "message your own
// customer list" flow. The second one has no real SMS/email/WhatsApp
// sender wired up yet (no Twilio/SendGrid/WhatsApp Business API
// configured — same "not yet built" bucket as real Stripe Connect, see
// CLAUDE.md), so sending is explicitly simulated: it parses the CSV for
// real and reports a real contact count, but never actually messages
// anyone, and says so.
export function ShareDealModal({
  open, onOpenChange, dealId, dealTitle,
}: {
  open:         boolean
  onOpenChange: (open: boolean) => void
  dealId:       string
  dealTitle:    string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [fileName, setFileName] = useState("")
  const [channels, setChannels] = useState<Record<Channel, boolean>>({ sms: false, email: true, whatsapp: false })
  const [sending, setSending] = useState(false)

  function dealUrl() {
    return `${window.location.origin}/checkout/${dealId}`
  }
  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this group buy: ${dealTitle}, ${dealUrl()}`)}`, "_blank")
  }
  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this group buy for ${dealTitle} at Groupal! ${dealUrl()}`)}`, "_blank")
  }
  function copyLink() {
    navigator.clipboard.writeText(dealUrl())
    toast.success("Link copied!")
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result ?? ""))
      setContacts(parsed)
      if (parsed.length === 0) {
        toast.error("Couldn't find any contacts, make sure your CSV has a name column.")
      }
    }
    reader.readAsText(file)
  }

  function toggleChannel(key: Channel) {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function sendCampaign() {
    const anyChannel = channels.sms || channels.email || channels.whatsapp
    if (contacts.length === 0 || !anyChannel || sending) return
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setSending(false)
    const channelLabels = CHANNELS.filter((c) => channels[c.key]).map((c) => c.label).join(", ")
    toast.success(
      `Simulated: ${contacts.length} customer${contacts.length === 1 ? "" : "s"} would be reached via ${channelLabels}.`
    )
    setContacts([])
    setFileName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="bg-[#002356]/60 backdrop-blur-sm" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this deal</DialogTitle>
          <DialogDescription>The more buyers who see it, the faster the discount grows.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Share on social</p>
            <div className="flex gap-2">
              <button
                onClick={shareWhatsApp}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-[#002356] border border-gray-200 hover:border-[#002356]/30 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                WhatsApp
              </button>
              <button
                onClick={shareTwitter}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-[#002356] border border-gray-200 hover:border-[#002356]/30 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                X / Twitter
              </button>
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-[#002356] border border-gray-200 hover:border-[#002356]/30 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Reach your own customers</p>
            <p className="text-xs text-gray-400 mb-3">
              Upload a CSV of your customers (columns: name, email, phone) and message them about this deal.
            </p>

            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#002356]/30 text-sm font-semibold text-gray-500 hover:text-[#002356] transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              {fileName || "Upload customer CSV"}
            </button>

            {contacts.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mt-2">
                  {contacts.length} contact{contacts.length === 1 ? "" : "s"} detected
                </p>

                <div className="flex gap-2 mt-3">
                  {CHANNELS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleChannel(key)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer",
                        channels[key] ? "border-[#002356] bg-[#002356]/5 text-[#002356]" : "border-gray-200 text-gray-400"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={sendCampaign}
                  disabled={sending || !(channels.sms || channels.email || channels.whatsapp)}
                  className="w-full mt-3 py-3 rounded-xl font-extrabold text-white text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ backgroundColor: "#048943" }}
                >
                  {sending ? "Sending..." : `Send to ${contacts.length} customer${contacts.length === 1 ? "" : "s"}`}
                </button>
                <p className="text-[11px] text-gray-400 mt-2 text-center">
                  Simulated for now, real SMS/email/WhatsApp delivery is coming soon.
                </p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
