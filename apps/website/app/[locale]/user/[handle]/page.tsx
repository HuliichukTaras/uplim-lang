import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'

export default async function UserProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch profile by handle and redirect to username route
  const { data: profile } = await supabase.from("profiles").select("username, handle").eq("handle", handle).maybeSingle()

  if (profile) {
    redirect(`/profile/${profile.username || profile.handle}`)
  }

  // Check if this is an old handle and redirect to the new one
  const { data: history } = await supabase
    .from("handle_history")
    .select("new_handle")
    .eq("old_handle", handle)
    .order("changed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (history) {
    redirect(`/profile/${history.new_handle}`)
  }

  if (!profile) {
    redirect("/feed")
  }
}
