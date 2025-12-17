"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Link } from "@/i18n/navigation"
import { AnimatePresence, motion } from "framer-motion"

interface SuggestedUser {
  id: string
  handle: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

export function SuggestedUsers() {
  const [users, setUsers] = useState<SuggestedUser[]>([])
  const [userPool, setUserPool] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    let channel: any

    const fetchSuggestedUsers = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: followsData } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)

      const followingSet = new Set(followsData?.map((f) => f.following_id) || [])
      setFollowingIds(followingSet)

      const { data } = await supabase
        .from("profiles")
        .select("id, handle, display_name, avatar_url, bio, created_at")
        .neq("id", user.id)
        .order("created_at", { ascending: false })
        .limit(25)

      if (data) {
        // Show ALL new users, even without handle/display_name (they just registered)
        const validUsers = data
          .filter((u) => !followingSet.has(u.id))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setUsers(validUsers.slice(0, 5))
        setUserPool(validUsers.slice(5))
      }
      setLoading(false)

      // Subscribe to new profile registrations in realtime
      channel = supabase
        .channel("realtime:new-users")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
          const newUser = payload.new as SuggestedUser & { created_at: string }
          // Don't show current user
          if (newUser.id === user.id) return
          // Don't show if already following
          if (followingSet.has(newUser.id)) return

          // Add new user to the TOP of the list immediately
          setUsers((prev) => {
            // Check if already in list
            if (prev.some(u => u.id === newUser.id)) return prev

            const updated = [newUser, ...prev]
            if (updated.length > 5) {
              setUserPool((currentPool) => [...updated.slice(5), ...currentPool])
              return updated.slice(0, 5)
            }
            return updated
          })
        })
        // Also listen for profile updates (when user adds handle/display_name)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
          const updatedUser = payload.new as SuggestedUser
          if (updatedUser.id === user.id) return

          // Update user in list if they exist
          setUsers((prev) => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
          setUserPool((prev) => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
        })
        .subscribe()
    }

    fetchSuggestedUsers()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const handleFollowClick = async (userId: string) => {
    if (processingIds.has(userId)) return

    setProcessingIds((prev) => new Set(prev).add(userId))
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
      return
    }

    const isFollowing = followingIds.has(userId)

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId)

      setFollowingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: userId,
      })

      setFollowingIds((prev) => new Set(prev).add(userId))

      setTimeout(() => {
        setUsers((prevUsers) => {
          const filtered = prevUsers.filter((u) => u.id !== userId)

          if (userPool.length > 0) {
            const [nextUser, ...remainingPool] = userPool
            setUserPool(remainingPool)
            return [...filtered, nextUser]
          }

          return filtered
        })
      }, 500)
    }

    setProcessingIds((prev) => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-2 bg-muted rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Suggested for you</h3>
        <Link href="/suggested" className="text-xs font-semibold text-primary hover:text-primary/80">
          See All
        </Link>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {users.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 px-4"
            >
              <Link href={`/${user.handle}`}>
                <Avatar className="w-10 h-10 border-2 border-border">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.handle} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs">
                    {(user.display_name || user.handle)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/${user.handle}`} className="block">
                  <p className="text-sm font-semibold text-foreground truncate hover:underline">
                    {user.display_name || user.handle}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
                </Link>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="text-xs font-semibold text-primary hover:text-primary/80"
                onClick={() => handleFollowClick(user.id)}
                disabled={processingIds.has(user.id) || followingIds.has(user.id)}
              >
                {followingIds.has(user.id) ? "Following" : "Follow"}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
