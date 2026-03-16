"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface FeedLayoutProps {
  /** Main feed content */
  children: React.ReactNode
  /** Optional right sidebar (suggestions, ads, etc.) */
  rightSidebar?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Two-column layout for feed + sidebar
 * Inspired by Instagram's desktop layout structure
 * - Feed: max-w-2xl centered
 * - Right sidebar: fixed width ~320px
 */
export function FeedLayout({ children, rightSidebar, className }: FeedLayoutProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="flex gap-8 lg:gap-10">
          {/* Main feed column */}
          <div className="flex-1 min-w-0">
            <div className="max-w-[720px] mx-auto">{children}</div>
          </div>

          {/* Right sidebar - hidden on mobile/tablet */}
          {rightSidebar && (
            <aside className="hidden xl:block w-80 flex-shrink-0 sticky top-20 self-start h-fit">{rightSidebar}</aside>
          )}
        </div>
      </div>
    </div>
  )
}
