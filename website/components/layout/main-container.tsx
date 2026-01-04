"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface MainContainerProps {
  children: React.ReactNode
  /** Maximum width of the container */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  /** Whether to apply horizontal padding */
  withPadding?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Main content container with responsive width and centering
 * Based on Instagram's container structure
 */
export function MainContainer({ 
  children, 
  maxWidth = "2xl", 
  withPadding = true,
  className 
}: MainContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-2xl",      // ~672px - Feed width
    md: "max-w-3xl",      // ~768px
    lg: "max-w-5xl",      // ~1024px
    xl: "max-w-6xl",      // ~1280px
    "2xl": "max-w-7xl",   // ~1440px - Full app width
    full: "max-w-full",
  }

  return (
    <div
      className={cn(
        "w-full mx-auto",
        maxWidthClasses[maxWidth],
        withPadding && "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  )
}
