export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20 animate-pulse">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/4" />
      </div>
    </div>
  )
}
