"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Link } from "@/i18n/navigation"
import { ArrowLeft } from "lucide-react"

interface SuggestedUser {
  id: string
  handle: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

interface SuggestedPageClientProps {
  initialUsers: SuggestedUser[]
  currentUserId: string
  initialFollowing: string[]
}

export function SuggestedPageClient({ initialUsers, currentUserId, initialFollowing }: SuggestedPageClientProps) {
  const [users, setUsers] = useState<SuggestedUser[]>(initialUsers)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set(initialFollowing))
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const handleFollowClick = async (userId: string) => {
    if (processingIds.has(userId)) return

    setProcessingIds((prev) => new Set(prev).add(userId))
    const supabase = createClient()

    const isFollowing = followingIds.has(userId)

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", userId)

      setFollowingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: userId,
      })

      setFollowingIds((prev) => new Set(prev).add(userId))
    }

    setProcessingIds((prev) => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4 max-w-[720px] mx-auto">
          <Link href="/feed" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Suggested for you</h1>
        </div>
      </div>

      <main className="max-w-[720px] mx-auto px-4 py-6">
        <div className="grid gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
            >
              <Link href={`/${user.handle}`}>
                <Avatar className="w-12 h-12 border border-gray-200">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.handle} />
                  <AvatarFallback className="bg-gray-100 text-gray-500">
                    {(user.display_name || user.handle)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/${user.handle}`} className="block group">
                  <p className="font-semibold text-foreground truncate group-hover:underline">
                    {user.display_name || user.handle}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">@{user.handle}</p>
                </Link>
                {user.bio && <p className="text-sm text-gray-500 truncate mt-1 max-w-[400px]">{user.bio}</p>}
              </div>

              <Button
                size="sm"
                variant={followingIds.has(user.id) ? "outline" : "default"}
                className={followingIds.has(user.id) ? "w-24" : "w-24 bg-primary hover:bg-primary/90"}
                onClick={() => handleFollowClick(user.id)}
                disabled={processingIds.has(user.id)}
              >
                {followingIds.has(user.id) ? "Following" : "Follow"}
              </Button>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No suggestions available right now.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
