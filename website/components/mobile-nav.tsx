"use client"

import { Home, Search, PlusCircle, MessageCircle, User, Megaphone } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Profile {
  handle: string | null
}

export function MobileNav({ user, profile }: { user: any; profile?: Profile | null }) {
  const pathname = usePathname()
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    const fetchUnreadMessagesCount = async () => {
      const { data, error } = await supabase.rpc("get_my_unread_message_count")
      if (!error && typeof data === "number") {
        setUnreadMessagesCount(data)
      }
    }

    fetchUnreadMessagesCount()

    const channel = supabase
      .channel("mobile-nav-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadMessagesCount()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadMessagesCount()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const isAuthPage = pathname?.startsWith("/auth")
  const isLandingPage = pathname === "/"

  if (isAuthPage || isLandingPage) {
    return null
  }

  const profileHref = user && profile?.handle ? `/${profile.handle}` : "/settings"

  const navItems = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/discover", icon: Search, label: "Discover" },
    { href: "/promote", icon: Megaphone, label: "Ads", highlight: false, beta: true },
    { href: user ? "/upload" : "/auth/login?redirect=/upload", icon: PlusCircle, label: "Add" },
    { href: user ? "/messages" : "/auth/login?redirect=/messages", icon: MessageCircle, label: "Inbox" },
    { href: profileHref, icon: User, label: "Profile" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-border/50 safe-area-inset-bottom neuro-raised">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const isInbox = item.label === "Inbox"
          const isBeta = (item as any).beta

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 active:scale-95",
                isActive && "text-primary",
                !isActive && "text-muted-foreground",
                item.highlight && !isActive && "text-amber-600",
              )}
            >
              <div className={cn("relative flex items-center justify-center", item.highlight && "rounded-full")}>
                <Icon className={cn("h-6 w-6", item.highlight && isActive && "text-amber-600")} />
                {isActive && !item.highlight && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary glow-cyan" />
                )}
                {isActive && item.highlight && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-amber-600" />}
                {isInbox && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium flex items-center gap-0.5">
                {item.label}
                {isBeta && (
                  <span className="text-[8px] font-bold text-amber-600 bg-amber-100 px-1 rounded-sm">BETA</span>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
