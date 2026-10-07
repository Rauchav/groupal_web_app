"use client"

import { useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { Camera, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB — Clerk's own setProfileImage limit

// Pulls the human-readable message out of a Clerk API error — these come
// back as { errors: [{ message, longMessage, code }] }, not a plain Error.
function clerkErrorMessage(err: unknown, fallback: string): string {
  const errors = (err as { errors?: { longMessage?: string; message?: string }[] })?.errors
  return errors?.[0]?.longMessage ?? errors?.[0]?.message ?? fallback
}

// Shared by both buyer and seller settings pages — click to upload a real
// custom profile picture via Clerk's own user.setProfileImage(). No S3/
// Supabase storage needed, Clerk already hosts and serves this image
// itself, the same mechanism that already supplies a Google/Apple
// sign-in's avatar.
//
// Deliberately NOT conditioned on how the account signed in: a buyer or
// seller with a Google-provided photo can still click through and
// override it with their own upload — Clerk's setProfileImage works
// identically regardless of sign-in strategy, same as most consumer apps
// let you override a synced OAuth avatar. The one thing this component
// does key off is `user.hasImage` (NOT `user.imageUrl`, which is always a
// truthy URL — Clerk serves a generic silhouette placeholder there for
// any account with no real custom/OAuth image, so checking it alone
// always renders that placeholder instead of falling back to `fallback`).
export function ProfileImageUpload({
  size = 64,
  rounded = "rounded-full",
  fallback,
  className,
}: {
  size?: number
  rounded?: string
  fallback: ReactNode
  className?: string
}) {
  const { user } = useUser()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // lets picking the same file again re-fire onChange
    if (!file || !user) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("That image is too large, please choose one under 5MB.")
      return
    }

    setUploading(true)
    try {
      await user.setProfileImage({ file })
      toast.success("Profile picture updated!")
    } catch (err) {
      toast.error(clerkErrorMessage(err, "Couldn't update your profile picture, please try again."))
    } finally {
      setUploading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className={cn(
        "group relative flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer disabled:cursor-wait",
        rounded,
        className
      )}
      style={{ height: size, width: size, backgroundColor: "#eaad00" }}
      aria-label="Change profile picture"
    >
      {user?.hasImage ? (
        <Image src={user.imageUrl} alt="Profile" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        fallback
      )}

      {/* Hover/uploading overlay — always mounted (not conditional on
          group-hover) so the spinner shows without needing a hover state
          mid-upload on a touch device. */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
          uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-white" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </button>
  )
}
