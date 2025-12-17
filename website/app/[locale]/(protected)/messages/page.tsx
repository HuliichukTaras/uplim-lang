import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MessagesClient from "@/components/messages/messages-client"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

export const dynamic = "force-dynamic" // Force dynamic rendering to prevent stale auth/redirect loops

export const metadata: Metadata = generateSEOMetadata({
  title: "Messages",
  description: "Connect with creators and manage your conversations on Fantikx.",
  url: `${DEFAULT_SEO.siteUrl}/messages`,
  type: "website",
  noIndex: true, // Private messaging page should not be indexed
})

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const params = await searchParams
  const recipientHandle = params.user

  let recipientProfile = null
  if (recipientHandle) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url")
      .eq("handle", recipientHandle)
      .maybeSingle()
    recipientProfile = data
  }

  return <MessagesClient currentUserId={user.id} initialRecipient={recipientProfile} />
}
