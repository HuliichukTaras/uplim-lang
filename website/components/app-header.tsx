"use client"

import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { LanguageSwitcher } from "@/components/language-switcher"

interface Profile {
  handle: string | null
}

export function AppHeader({ user, profile }: { user: any; profile: Profile | null }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith("/auth")
  const isLandingPage = pathname === "/"

  if (isAuthPage || isLandingPage) {
    return null
  }

  const profileHref = user && profile?.handle ? `/${profile.handle}` : "/settings"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-[1440px]">
        <Link href="/feed" className="flex items-center">
          <img src="/logo.png" alt="Fantikx" width={120} height={32} className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher isCollapsed={true} />
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          {user && <NotificationBell />}
          {user ? (
            <Link href={profileHref}>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 overflow-hidden neuro-raised">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url || "/placeholder.svg"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7]" />
                )}
              </Button>
            </Link>
          ) : (
            <Link href="/">
              <Button size="sm" className="neuro-raised rounded-xl">
                <span className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7] bg-clip-text text-transparent font-semibold">
                  Sign In
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
