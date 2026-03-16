import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

interface ProfileIndexPageProps {
  params: Promise<{ locale: string }>
}

export default async function ProfileIndexPage({ params }: ProfileIndexPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If authenticated, redirect to their own profile by handle
  if (user?.id) {
    const { data: profile } = await supabase.from("profiles").select("handle").eq("id", user.id).maybeSingle()

    if (profile?.handle) {
      const { locale } = await params
      redirect(`/${locale}/profile/${profile.handle}`)
    }
  }

  // If not authenticated, redirect to feed
  const { locale } = await params
  redirect(`/${locale}/feed`)
}
