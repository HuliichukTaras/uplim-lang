import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UploadContent } from "@/components/upload-content"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

export const metadata: Metadata = generateSEOMetadata({
  title: "Upload Content",
  description: "Share your exclusive content and earn from your creativity on Fantikx.",
  url: `${DEFAULT_SEO.siteUrl}/upload`,
  type: "website",
  noIndex: true, // Private upload page should not be indexed
})

export default async function UploadPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  return <UploadContent userId={user.id} />
}
