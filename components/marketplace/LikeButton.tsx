"use client"

import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { motion } from "framer-motion"
import { useUser } from "@clerk/nextjs"
import { useLikesStore } from "@/lib/stores/likes-store"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  dealId: string
  className?: string
}

export function LikeButton({ dealId, className }: LikeButtonProps) {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const { toggleLike, isLiked } = useLikesStore()
  const liked = isLiked(dealId)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!isSignedIn) {
      router.push("/sign-in")
      return
    }
    toggleLike(dealId)
  }

  return (
    <motion.button
      onClick={handleClick}
      aria-label={liked ? "Remove from saved deals" : "Save this deal"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full",
        "backdrop-blur-sm transition-colors duration-150 shadow-sm cursor-pointer",
        liked
          ? "bg-white text-red-500"
          : "bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white",
        className
      )}
      animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <Heart
        className="h-3.5 w-3.5"
        fill={liked ? "currentColor" : "none"}
      />
    </motion.button>
  )
}
