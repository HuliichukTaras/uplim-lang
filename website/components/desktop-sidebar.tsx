"use client"

import {
  Home,
  Compass,
  Film,
  Bell,
  PlusSquare,
  User,
  Menu,
  Settings,
  LayoutDashboard,
  Video,
  Megaphone,
  Wallet,
  History,
  HelpCircle,
  MessageSquareWarning,
  MessageCircle,
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslations } from "next-intl"

interface Profile {
  handle: string | null
}

export function DesktopSidebar({ user, profile }: { user: any | null; profile: Profile | null }) {
  const t = useTranslations("sidebar")
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (!error) {
        setUnreadCount(count || 0)
      }
    }

    const fetchUnreadMessagesCount = async () => {
      const { data, error } = await supabase.rpc("get_my_unread_message_count")
      if (!error && typeof data === "number") {
        setUnreadMessagesCount(data)
      }
    }

    fetchUnreadCount()
    fetchUnreadMessagesCount()

    const channel = supabase
      .channel("notifications-sidebar")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount()
        },
      )
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

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut({ scope: "global" })
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      window.location.href = "/"
    }
  }

  const navItems = [
    { icon: Home, label: t("home"), href: "/feed", highlight: false },
    { icon: Compass, label: t("explore"), href: "/discover", highlight: false },
    { icon: Film, label: t("reels"), href: "/reels", highlight: false },
    { icon: Video, label: t("live"), href: "/live", highlight: false },
    {
      icon: Bell,
      label: t("notifications"),
      href: "/notifications",
      highlight: false,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { icon: Megaphone, label: t("ads"), href: "/promote", highlight: true, beta: true },
    { icon: PlusSquare, label: t("create"), href: "/upload", highlight: false },
    {
      icon: MessageCircle,
      label: t("messages"),
      href: "/messages",
      highlight: false,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    { icon: LayoutDashboard, label: t("dashboard"), href: "/dashboard", highlight: false },
    { icon: Wallet, label: t("wallet"), href: "/wallet", highlight: false },
    {
      icon: User,
      label: t("profile"),
      href: profile?.handle ? `/${profile.handle}` : "/profile",
      highlight: false,
    },
  ]

  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-0 top-0 h-screen bg-white/95 backdrop-blur-xl border-r border-border/50 flex-col transition-all duration-300 ease-in-out z-50 neuro-raised",
        "w-[88px] hover:w-[280px] group",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-16 flex items-center justify-center group-hover:justify-start group-hover:px-6 border-b border-border transition-all duration-300">
        <Link href="/" className="flex items-center gap-3 relative">
          <div className="block group-hover:hidden transition-all duration-200">
            <img src="/logo-mini.png" alt="Fantikx" className="h-8 w-auto object-contain" />
          </div>
          <div className="hidden group-hover:block transition-all duration-200">
            <img src="/logo.png" alt="Fantikx" className="h-8 w-auto object-contain" />
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <div className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const isNotification = item.label === t("notifications")
            const isMessages = item.label === t("messages")
            const isBeta = (item as any).beta

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-3 rounded-xl transition-all duration-200 w-full relative",
                  "justify-center group-hover:justify-start",
                  isActive
                    ? "bg-gradient-to-r from-[#00d4ff]/10 to-[#38bdf8]/10 text-foreground font-semibold glow-border-cyan"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  item.highlight &&
                    "bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20",
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-transform group-hover:scale-110 min-w-[24px] shrink-0",
                      isActive && "stroke-[2.5]",
                      item.highlight && "text-amber-600",
                    )}
                  />
                  {isNotification && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                  {isMessages && unreadMessagesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-base overflow-hidden whitespace-nowrap transition-all duration-300 opacity-0 w-0",
                    "group-hover:w-auto group-hover:opacity-100 group-hover:ml-4",
                  )}
                >
                  {item.label}
                  {isBeta && (
                    <span className="ml-2 text-[10px] font-bold leading-none uppercase bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                      Beta
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <div className="px-3 py-2 flex items-center justify-center group-hover:justify-start">
          <LanguageSwitcher isCollapsed={!isHovered} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full px-3 py-3 h-auto text-muted-foreground hover:bg-muted hover:text-foreground",
                "justify-center group-hover:justify-start",
              )}
            >
              <Menu className="h-6 w-6 min-w-[24px] shrink-0" />
              <span
                className={cn(
                  "text-base overflow-hidden whitespace-nowrap transition-all duration-300 opacity-0 w-0",
                  "group-hover:w-auto group-hover:opacity-100 group-hover:ml-4",
                )}
              >
                More
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-56 bg-white border-border neuro-raised">
            <DropdownMenuItem asChild>
              <Link href="/transactions" className="cursor-pointer text-foreground">
                <History className="mr-2 h-4 w-4" />
                {t("transactions")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("settings")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>{t("help")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquareWarning className="mr-2 h-4 w-4" />
              <span>{t("report")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive hover:bg-muted">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
