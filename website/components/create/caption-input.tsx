"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"

interface CaptionInputProps {
  value: string
  onChange: (value: string) => void
}

const LINK_PATTERN = /((http|https):\/\/|www\.|[a-zA-Z0-9]+\.[a-z]{2,10})/gi

export function CaptionInput({ value, onChange }: CaptionInputProps) {
  const [hasLink, setHasLink] = useState(false)

  useEffect(() => {
    setHasLink(LINK_PATTERN.test(value))
  }, [value])

  const extractHashtags = (text: string): string[] => {
    const hashtagPattern = /#[\w\u0400-\u04FF]+/g
    return text.match(hashtagPattern)?.map((tag) => tag.slice(1)) || []
  }

  const hashtags = extractHashtags(value)

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a caption..."
        className="resize-none border-0 border-b rounded-none focus-visible:ring-0 px-0 text-base min-h-[80px]"
        rows={3}
      />

      {/* Hashtags preview */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hashtags.slice(0, 10).map((tag, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              #{tag}
            </span>
          ))}
          {hashtags.length > 10 && <span className="text-xs text-muted-foreground">+{hashtags.length - 10} more</span>}
        </div>
      )}

      {/* Link warning - compact */}
      {hasLink && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Links are not allowed</span>
        </div>
      )}
    </div>
  )
}
