import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LiveStreamsClient from "@/components/live/live-streams-client"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

export const metadata: Metadata = generateSEOMetadata({
  title: "Live Streams",
  description: "Watch live streams from your favorite creators on Fantikx.",
  url: `${DEFAULT_SEO.siteUrl}/live`,
  type: "website",
})

export default async function LivePage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return <LiveStreamsClient currentUser={profile} />
}
