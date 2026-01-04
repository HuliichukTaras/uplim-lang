import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/settings/settings-client"
import { MobileNav } from "@/components/mobile-nav"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

export const metadata: Metadata = generateSEOMetadata({
  title: "Settings",
  description: "Manage your account settings, privacy, and preferences on Fantikx.",
  url: `${DEFAULT_SEO.siteUrl}/settings`,
  type: "website",
  noIndex: true, // Private settings page should not be indexed
})

interface SettingsPageProps {
  searchParams: Promise<{ setup?: string }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const params = await searchParams
  const isSetup = params.setup === "true"

  return (
    <>
      <SettingsClient profile={profile} user={user} isSetup={isSetup} />
      <MobileNav user={user} profile={profile} />
    </>
  )
}
