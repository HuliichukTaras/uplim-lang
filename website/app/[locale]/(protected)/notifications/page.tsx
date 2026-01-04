import { NotificationList } from "@/components/notifications/notification-list"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

export const metadata: Metadata = generateSEOMetadata({
  title: "Notifications",
  description: "Stay updated with your latest notifications and activity on Fantikx.",
  url: `${DEFAULT_SEO.siteUrl}/notifications`,
  type: "website",
  noIndex: true, // Private notifications page should not be indexed
})

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="container max-w-[720px] mx-auto py-8 px-4 md:px-0">
      <div className="mb-8 px-4 md:px-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
        <p className="text-muted-foreground">Stay updated with your latest activity</p>
      </div>

      <NotificationList />
    </div>
  )
}
