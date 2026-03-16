"use client"

import { NotificationItem } from "./notification-item"
import { NotificationSkeleton } from "./notification-skeleton"
import { NotificationEmpty } from "./notification-empty"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface Notification {
  id: string
  type: string
  metadata: any
  read: boolean
  created_at: string
  actor?: {
    id: string
    display_name: string | null
    handle: string | null
    avatar_url: string | null
  } | null
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [clearingRead, setClearingRead] = useState(false)

  const fetchNotifications = async (append = false) => {
    try {
      const response = await fetch(`/api/notifications/get?limit=20&offset=${append ? offset : 0}`)
      const data = await response.json()

      if (append) {
        setNotifications((prev) => [...prev, ...(data.notifications || [])])
      } else {
        setNotifications(data.notifications || [])
      }

      setHasMore(data.hasMore || false)
      setOffset(append ? offset + 20 : 20)
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      })

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true)
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    } finally {
      setMarkingAllRead(false)
    }
  }

  const handleClearRead = async () => {
    setClearingRead(true)
    try {
      await fetch("/api/notifications/clear-read", {
        method: "DELETE",
      })

      setNotifications((prev) => prev.filter((n) => !n.read))
    } catch (error) {
      console.error("[v0] Error clearing read notifications:", error)
    } finally {
      setClearingRead(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return <NotificationEmpty />
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={markingAllRead} className="text-[#00d4ff] hover:bg-[#00d4ff]/10">
              {markingAllRead ? "Marking..." : "Mark all read"}
            </Button>
          )}
          {notifications.some((n) => n.read) && (
            <Button variant="ghost" size="sm" onClick={handleClearRead} disabled={clearingRead} className="text-muted-foreground hover:bg-muted">
              {clearingRead ? "Clearing..." : "Clear read"}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} onRead={handleMarkRead} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <Button variant="outline" className="w-full neuro-raised rounded-xl" onClick={() => fetchNotifications(true)}>
          Load more
        </Button>
      )}
    </div>
  )
}
