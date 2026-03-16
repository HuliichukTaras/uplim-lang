import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Unsubscribed - Fantikx",
  description: "You have been unsubscribed from Fantikx emails",
}

export default function UnsubscribedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Successfully Unsubscribed</h1>
          <p className="text-muted-foreground">
            You've been unsubscribed from all Fantikx marketing emails. You may still receive important account-related
            notifications.
          </p>
        </div>

        <div className="p-4 bg-muted/50 rounded-xl space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Mail className="w-4 h-4" />
            <span>Changed your mind?</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You can re-enable email notifications anytime in your account settings.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/settings">
            <Button className="w-full">Manage Notification Settings</Button>
          </Link>
          <Link href="/feed">
            <Button variant="outline" className="w-full bg-transparent">
              Go to Feed
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">If you didn't request this, please contact support.</p>
      </div>
    </div>
  )
}
