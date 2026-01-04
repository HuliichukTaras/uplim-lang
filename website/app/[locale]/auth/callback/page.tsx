"use client"

import { sanitizeRedirectPath } from "@/lib/auth/oauth"
import { createClient } from "@/lib/supabase/client"
import { generateUniqueHandle } from "@/lib/utils/handle"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [error, setError] = useState<string | null>(null)

  const locale = pathname.split("/")[1] || "en"

  useEffect(() => {
    const handleCallback = async () => {
      const next = sanitizeRedirectPath(searchParams.get("next"))
      const code = searchParams.get("code")
      const providerError =
        searchParams.get("error_description") ?? searchParams.get("error") ?? searchParams.get("error_code")

      if (providerError) {
        console.error("[Auth] OAuth provider error:", providerError)
        setError(providerError)
        setTimeout(() => router.replace(`/${locale}`), 3000)
        return
      }

      try {
        const supabase = createClient()

        const { data: existingSession, error: getSessionError } = await supabase.auth.getSession()

        if (getSessionError) {
          throw getSessionError
        }

        if (!existingSession.session) {
          if (!code) {
            throw new Error("Unable to find an active session")
          }

          const { data: exchangedSession, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            throw exchangeError
          }

          if (!exchangedSession.session) {
            throw new Error("Unable to create a session")
          }
        }

        const { data: verifiedSession, error: verifyError } = await supabase.auth.getSession()

        if (verifyError || !verifiedSession.session) {
          throw verifyError ?? new Error("Session inactive after exchange")
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("handle, display_name")
          .eq("id", verifiedSession.session.user.id)
          .maybeSingle()

        if (!profile || !profile.handle) {
          const displayName =
            profile?.display_name ||
            verifiedSession.session.user.user_metadata?.full_name ||
            verifiedSession.session.user.email?.split("@")[0] ||
            "user"
          const uniqueHandle = await generateUniqueHandle(displayName, verifiedSession.session.user.id)

          await supabase
            .from("profiles")
            .update({
              handle: uniqueHandle,
            })
            .eq("id", verifiedSession.session.user.id)
        }

        const nextWithLocale = next.startsWith(`/${locale}`) ? next : `/${locale}${next}`
        window.location.href = nextWithLocale
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Authorization error"
        console.error("[Auth] Callback error:", err)
        setError(errorMessage)

        setTimeout(() => {
          router.replace(`/${locale}`)
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, router, locale])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-[#fafbfc] via-[#f5f7fa] to-[#f0f2f5]">
      <div className="text-center max-w-md">
        {error ? (
          <div className="space-y-4">
            <div className="text-6xl">❌</div>
            <h1 className="text-2xl font-bold text-red-600">Authorization Error</h1>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to the sign-in page...</p>
          </div>
        ) : (
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#00d4ff] border-r-transparent"></div>
        )}
      </div>
    </div>
  )
}
