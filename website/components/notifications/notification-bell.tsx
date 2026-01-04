"use client"

import { Bell, Check, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { NotificationItem } from "./notification-item"
import { Link } from "@/i18n/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

interface Notification {
  id: string
  type: string
  metadata: any
  read: boolean
  created_at: string
  count: number
  group_key: string | null
  actor?: {
    id: string
    display_name: string | null
    handle: string | null
    avatar_url: string | null
  } | null
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const fetchUnreadCount = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    console.log("[v0] fetchUnreadCount - user:", user?.id)
    if (!user) return

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)

    console.log("[v0] fetchUnreadCount - count:", count, "error:", error)
    if (!error) {
      setUnreadCount(count || 0)
    }
  }, [supabase])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    console.log("[v0] fetchNotifications - user:", user?.id)
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id,
        type,
        metadata,
        read,
        created_at,
        count,
        group_key,
        actor:profiles!notifications_actor_id_fkey (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    console.log("[v0] fetchNotifications - data:", data, "error:", error)
    if (!error && data) {
      setNotifications(data as Notification[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUnreadCount()

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchUnreadCount()
          if (open) {
            fetchNotifications()
          }
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [fetchUnreadCount, fetchNotifications, open, supabase])

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id)

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white glow-cyan",
                "bg-gradient-to-r from-[#00d4ff] to-[#38bdf8]",
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 bg-background/95 backdrop-blur-xl border-border/50"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-2 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onRead={handleMarkAsRead} compact />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border/50 p-2">
            <Button
              variant="ghost"
              className="w-full text-sm text-[#00d4ff] hover:text-[#00d4ff]/80"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href="/notifications">View all notifications</Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
