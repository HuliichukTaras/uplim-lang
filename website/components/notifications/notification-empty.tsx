import { Bell } from 'lucide-react'

export function NotificationEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center neuro-inset mb-6">
        <Bell className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        When someone likes, comments, or interacts with your content, you'll see it here
      </p>
    </div>
  )
}
