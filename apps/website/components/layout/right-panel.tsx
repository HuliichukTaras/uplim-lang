"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface RightPanelProps {
  children: React.ReactNode
  title?: string
  className?: string
}

/**
 * Right sidebar panel for suggestions, notifications, etc.
 * Sticky positioned on desktop, hidden on mobile
 */
export function RightPanel({ children, title, className }: RightPanelProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h2 className="text-sm font-semibold text-muted-foreground px-4">
          {title}
        </h2>
      )}
      <Card className="p-4 neuro-raised border-0">
        {children}
      </Card>
    </div>
  )
}
