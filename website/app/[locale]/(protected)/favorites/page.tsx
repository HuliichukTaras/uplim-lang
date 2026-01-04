import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FavoritesClient } from "@/components/favorites/favorites-client"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

export const metadata: Metadata = generateSEOMetadata({
  title: "Favorites",
  description: "View your saved favorite posts and content on Fantikx.",
  url: `${DEFAULT_SEO.siteUrl}/favorites`,
  type: "website",
  noIndex: true, // Private favorites page should not be indexed
})

export default async function FavoritesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return <FavoritesClient userId={user.id} />
}
