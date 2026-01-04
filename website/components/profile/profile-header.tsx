"use client"

import Image from "next/image"
import { Verified, Copy, Check } from 'lucide-react'
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Profile {
  handle: string
  display_name: string | null
  avatar_url: string | null
  is_creator: boolean
}

interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile: boolean
  isFollowing: boolean
  onFollow: () => void
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    const profileUrl = `${window.location.origin}/${profile.handle}`
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-start gap-6 md:gap-8">
      {/* Avatar */}
      <div className="relative">
        <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden ring-2 ring-border">
          <Image
            src={profile.avatar_url || "/placeholder.svg?height=128&width=128"}
            alt={profile.display_name || profile.handle}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl md:text-2xl font-bold">{profile.display_name || profile.handle}</h1>
          {profile.is_creator && <Verified className="w-5 h-5 text-primary fill-primary" />}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-muted-foreground">@{profile.handle}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopyLink}
            title="Copy profile link"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
