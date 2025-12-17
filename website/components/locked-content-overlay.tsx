"use client"

import { Lock, Sparkles, Users, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { eurToCoins } from "@/lib/wallet"
import { cn } from "@/lib/utils"

interface LockedContentOverlayProps {
  price: number // EUR price
  isAdult?: boolean
  onUnlock: () => void
  variant?: "card" | "modal" | "grid"
  className?: string
}

export function LockedContentOverlay({
  price,
  isAdult = false,
  onUnlock,
  variant = "card",
  className,
}: LockedContentOverlayProps) {
  const priceInCoins = eurToCoins(price)

  const sizeClasses = {
    card: {
      container: "p-6",
      icon: "w-14 h-14",
      iconInner: "w-7 h-7",
      title: "text-lg",
      subtitle: "text-sm",
      button: "py-5",
      badges: "text-xs",
    },
    modal: {
      container: "p-8",
      icon: "w-16 h-16",
      iconInner: "w-8 h-8",
      title: "text-xl",
      subtitle: "text-base",
      button: "py-6",
      badges: "text-sm",
    },
    grid: {
      container: "p-4",
      icon: "w-10 h-10",
      iconInner: "w-5 h-5",
      title: "text-base",
      subtitle: "text-xs",
      button: "py-3 text-sm",
      badges: "hidden",
    },
  }

  const sizes = sizeClasses[variant]

  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center z-20", className)}>
      {/* Blur overlay background */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Content */}
      <div className={cn("relative z-30 text-center max-w-xs mx-auto", sizes.container)}>
        {/* Lock icon */}
        <div
          className={cn(
            "bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg",
            sizes.icon,
          )}
        >
          <Lock className={cn("text-white", sizes.iconInner)} />
        </div>

        {/* Title */}
        <h3 className={cn("font-bold text-white mb-1 drop-shadow-md", sizes.title)}>
          {isAdult ? "18+ Content" : "Premium Content"}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-2xl mb-1">
          {priceInCoins} <Coins className="w-5 h-5" />
        </div>
        <p className={cn("text-zinc-300 mb-4", sizes.subtitle)}>≈ €{price.toFixed(2)}</p>

        {/* Unlock button */}
        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onUnlock()
          }}
          className={cn(
            "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-xl transition-all hover:scale-[1.02]",
            sizes.button,
          )}
        >
          <Lock className="w-4 h-4 mr-2" />
          Unlock Content
        </Button>

        {/* Unlock methods badges */}
        <div className={cn("mt-4 flex items-center justify-center gap-3 text-zinc-300 font-medium", sizes.badges)}>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quest
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Coins className="w-3 h-3" /> Coins
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> Sub
          </span>
        </div>
      </div>
    </div>
  )
}
