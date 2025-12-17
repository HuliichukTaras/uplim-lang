"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Link } from "@/i18n/navigation"
import { UserPlus, DollarSign, CheckCircle, AlertCircle, Bell, MessageCircle, Users } from "lucide-react"
import { HeartIcon, CommentIcon, ShareIcon } from "@/components/flaticon-icons"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: {
    id: string
    type: string
    metadata: any
    read: boolean
    created_at: string
    count?: number
    group_key?: string | null
    actor?: {
      id: string
      display_name: string | null
      handle: string | null
      avatar_url: string | null
    } | null
  }
  onRead: (id: string) => void
  compact?: boolean
}

export function NotificationItem({ notification, onRead, compact = false }: NotificationItemProps) {
  const count = notification.count || 1
  const actorName = notification.actor?.display_name || notification.actor?.handle || "Someone"

  const getNotificationDetails = () => {
    const { type, metadata, actor } = notification

    const getAggregatedText = (singularAction: string, pluralAction: string) => {
      if (count > 1) {
        return `${actorName} and ${count - 1} other${count > 2 ? "s" : ""} ${pluralAction}`
      }
      return `${actorName} ${singularAction}`
    }

    switch (type) {
      case "new_follower":
        return {
          icon:
            count > 1 ? <Users className="h-5 w-5 text-[#00d4ff]" /> : <UserPlus className="h-5 w-5 text-[#00d4ff]" />,
          text: getAggregatedText("started following you", "started following you"),
          link: actor?.handle ? `/${actor.handle}` : null,
        }
      case "new_message":
        return {
          icon: <MessageCircle className="h-5 w-5 text-[#00d4ff]" />,
          text: count > 1 ? `You have ${count} new messages` : `${actorName} sent you a message`,
          link: `/messages`,
        }
      case "new_like":
        return {
          icon: <HeartIcon className="h-5 w-5 text-[#ec4899]" filled />,
          text: getAggregatedText("liked your post", "liked your post"),
          link: metadata?.postId ? `/post/${metadata.postId}` : null,
        }
      case "new_comment":
        return {
          icon: <CommentIcon className="h-5 w-5 text-[#a855f7]" />,
          text: getAggregatedText("commented on your post", "commented on your post"),
          link: metadata?.postId ? `/post/${metadata.postId}` : null,
        }
      case "new_share":
        return {
          icon: <ShareIcon className="h-5 w-5 text-[#67e8f9]" />,
          text: getAggregatedText("shared your post", "shared your post"),
          link: metadata?.postId ? `/post/${metadata.postId}` : null,
        }
      case "new_subscriber":
        return {
          icon: <DollarSign className="h-5 w-5 text-[#10b981]" />,
          text: getAggregatedText("subscribed to you", "subscribed to you"),
          link: actor?.handle ? `/${actor.handle}` : null,
        }
      case "content_unlocked":
        return {
          icon: <CheckCircle className="h-5 w-5 text-[#10b981]" />,
          text: getAggregatedText("unlocked your content", "unlocked your content"),
          link: metadata?.postId ? `/post/${metadata.postId}` : null,
        }
      case "payout_processed":
        return {
          icon: <DollarSign className="h-5 w-5 text-[#10b981]" />,
          text: `Payout of ${metadata?.amount} ${metadata?.currency || "USD"} processed`,
          link: "/wallet",
        }
      case "payment_failed":
        return {
          icon: <AlertCircle className="h-5 w-5 text-[#ef4444]" />,
          text: "Payment failed. Please update your payment method",
          link: "/settings",
        }
      case "subscription_expiring":
        return {
          icon: <Bell className="h-5 w-5 text-[#f59e0b]" />,
          text: `Your subscription to ${metadata?.creatorName || "a creator"} expires soon`,
          link: metadata?.creatorHandle ? `/${metadata.creatorHandle}` : null,
        }
      case "tip_received":
        return {
          icon: <DollarSign className="h-5 w-5 text-[#10b981]" />,
          text: `${actorName} sent you a tip of ${metadata?.amount} ${metadata?.currency || "USD"}`,
          link: "/wallet",
        }
      case "mention":
        return {
          icon: <MessageCircle className="h-5 w-5 text-[#a855f7]" />,
          text: `${actorName} mentioned you in a ${metadata?.context || "post"}`,
          link: metadata?.postId ? `/post/${metadata.postId}` : null,
        }
      default:
        return {
          icon: <Bell className="h-5 w-5 text-muted-foreground" />,
          text: metadata?.message || "New notification",
          link: null,
        }
    }
  }

  const details = getNotificationDetails()
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id)
    }
  }

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 transition-all duration-200 cursor-pointer",
        "hover:bg-muted/50 active:scale-[0.99]",
        notification.read ? "bg-transparent" : "bg-[#00d4ff]/5",
        compact ? "p-3 rounded-lg" : "p-4 rounded-2xl neuro-raised",
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 relative">
        {notification.actor ? (
          <Avatar className={cn(compact ? "h-10 w-10" : "h-12 w-12", !compact && "neuro-raised")}>
            <AvatarImage src={notification.actor.avatar_url || undefined} alt={notification.actor.display_name || ""} />
            <AvatarFallback className="bg-gradient-to-br from-[#00d4ff] to-[#a855f7] text-white">
              {(notification.actor.display_name || notification.actor.handle || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              "rounded-full bg-muted flex items-center justify-center",
              compact ? "h-10 w-10" : "h-12 w-12 neuro-inset",
            )}
          >
            {details.icon}
          </div>
        )}
        {count > 1 && (
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00d4ff] px-1 text-[10px] font-bold text-white">
            +{count - 1}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "leading-relaxed",
            compact ? "text-sm" : "text-sm",
            notification.read ? "text-muted-foreground" : "text-foreground font-medium",
          )}
        >
          {details.text}
        </p>
        <p className={cn("text-muted-foreground mt-0.5", compact ? "text-[11px]" : "text-xs")}>{timeAgo}</p>
      </div>

      {!notification.read && (
        <div className={cn("flex-shrink-0 rounded-full bg-[#00d4ff]", compact ? "w-1.5 h-1.5" : "w-2 h-2 glow-cyan")} />
      )}
    </div>
  )

  if (details.link) {
    return <Link href={details.link}>{content}</Link>
  }

  return content
}
