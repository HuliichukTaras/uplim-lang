"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface FeedGridProps {
  children: React.ReactNode
  /** Grid layout variant */
  variant?: "single" | "two-col" | "three-col" | "four-col"
  /** Gap between items */
  gap?: "sm" | "md" | "lg"
  /** Additional CSS classes */
  className?: string
}

/**
 * Responsive grid layout for feed items
 * Adapts from single column (mobile) to multi-column (desktop)
 */
export function FeedGrid({ 
  children, 
  variant = "single", 
  gap = "md",
  className 
}: FeedGridProps) {
  const variantClasses = {
    single: "grid-cols-1",
    "two-col": "grid-cols-1 sm:grid-cols-2",
    "three-col": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "four-col": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  return (
    <div
      className={cn(
        "grid w-full",
        variantClasses[variant],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}
