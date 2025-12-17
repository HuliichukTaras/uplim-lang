"use client"

import { useState } from "react"
import { PostCard } from "@/components/feed/post-card"

interface PostViewProps {
  post: any
  currentUser: any
  isUnlocked: boolean
}

export function PostView({ post, currentUser, isUnlocked }: PostViewProps) {
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)

  return (
    <div className="max-w-[720px] mx-auto mt-8">
      <PostCard
        post={post}
        isUnlocked={isUnlocked}
        currentUserId={currentUser?.id || null}
        onUnlockClick={() => setShowUnlockDialog(true)}
      />
    </div>
  )
}
