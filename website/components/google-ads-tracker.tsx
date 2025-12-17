"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

// Helper component that uses search params
function GoogleAdsTrackerContent({ conversionId }: { conversionId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
      ;(window as any).gtag("config", conversionId, {
        page_path: url,
      })
    }
  }, [pathname, searchParams, conversionId])

  return null
}

// Main component wrapped in Suspense to prevent de-opt
export function GoogleAdsTracker({ conversionId }: { conversionId: string }) {
  return (
    <Suspense fallback={null}>
      <GoogleAdsTrackerContent conversionId={conversionId} />
    </Suspense>
  )
}
