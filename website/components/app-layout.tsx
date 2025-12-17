"use client"

import type React from "react"
import { AppHeader } from "@/components/app-header"
import { locales } from "@/i18n/config"
import { MobileNav } from "@/components/mobile-nav"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { EmailVerificationBanner } from "@/components/email-verification-banner"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

interface Profile {
  handle: string | null
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // Updated isAuthPage to correctly detect auth routes with locale prefixes
  const isAuthPage = pathname?.includes("/auth/")
  const isLandingPage = pathname === "/" || locales.some((locale) => pathname === `/${locale}`)
  const isLegalPage = pathname?.startsWith("/legal")

  useEffect(() => {
    if (isAuthPage || isLandingPage || isLegalPage) {
      return
    }

    const supabase = createClient()

    const fetchUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("handle").eq("id", user.id).maybeSingle()

        setProfile(profileData)
      }
    }

    fetchUserAndProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        supabase
          .from("profiles")
          .select("handle")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => setProfile(data))
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [isAuthPage, isLandingPage, isLegalPage])

  // Added isAuthPage to the early return to render without sidebar
  if (isLandingPage || isLegalPage || isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex bg-white">
      <DesktopSidebar user={user} profile={profile} />

      <div className="flex-1 flex flex-col md:ml-[88px]">
        <div className="md:hidden">
          <AppHeader user={user} profile={profile} />
        </div>

        {!isAuthPage && !isLandingPage && <EmailVerificationBanner />}

        {/* Enforced global max-width of 1440px for all pages as per requirements */}
        <main className="flex-1 w-full container mx-auto px-0 md:px-0 max-w-[1440px]">{children}</main>

        <MobileNav user={user} profile={profile} />
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
