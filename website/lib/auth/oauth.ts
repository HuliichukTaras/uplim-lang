import { createClient } from "@/lib/supabase/client"

const CALLBACK_PATH = "/auth/callback"
const DEFAULT_REDIRECT_PATH = "/feed"

const isBrowser = () => typeof window !== "undefined"

const resolveBaseUrl = () => {
  if (isBrowser()) {
    return window.location.origin
  }

  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL

  if (!envBaseUrl) {
    // Fallback to localhost for development
    return "http://localhost:3000"
  }

  return envBaseUrl
}

/**
 * Ensures we always redirect to a safe in-app location by rejecting external URLs.
 */
export const sanitizeRedirectPath = (rawPath: string | null | undefined) => {
  if (!rawPath) return DEFAULT_REDIRECT_PATH

  const trimmed = rawPath.trim()

  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("http")) {
    return DEFAULT_REDIRECT_PATH
  }

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`

  try {
    const url = new URL(normalized, "https://placeholder.local")
    return `${url.pathname}${url.search}${url.hash}` || DEFAULT_REDIRECT_PATH
  } catch {
    return DEFAULT_REDIRECT_PATH
  }
}

const getCurrentLocale = (): string => {
  if (!isBrowser()) return "en"

  const pathname = window.location.pathname
  const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/)
  return localeMatch ? localeMatch[1] : "en"
}

const buildRedirectUrl = (nextPath: string | null | undefined, baseUrlOverride?: string) => {
  // Use baseUrlOverride only if it's a non-empty string
  const baseUrl = baseUrlOverride && baseUrlOverride.trim() ? baseUrlOverride : resolveBaseUrl()
  const safeNext = sanitizeRedirectPath(nextPath)

  const locale = getCurrentLocale()
  const callbackPathWithLocale = `/${locale}${CALLBACK_PATH}`

  try {
    const callbackUrl = new URL(callbackPathWithLocale, baseUrl)
    callbackUrl.searchParams.set("next", safeNext)
    return callbackUrl.toString()
  } catch (error) {
    console.error("[v0] Failed to build redirect URL:", error)
    // Fallback: construct URL manually
    const fallbackBase = resolveBaseUrl()
    return `${fallbackBase}${callbackPathWithLocale}?next=${encodeURIComponent(safeNext)}`
  }
}

type GoogleOAuthOptions = {
  nextPath?: string | null
}

/**
 * Launches the Supabase Google OAuth flow using PKCE with a hardened redirect target.
 */
export const startGoogleOAuth = async (options: GoogleOAuthOptions = {}) => {
  const supabase = createClient()
  const redirectTo = buildRedirectUrl(options.nextPath ?? DEFAULT_REDIRECT_PATH)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error) {
    throw error
  }

  if (data?.url) {
    // Strategy to satisfy Google's disallowed_useragent policy:
    // 1. Try to redirect the top-level window (breaks out of iframes/v0 preview)
    // 2. If that fails (e.g. cross-origin), open in a new tab (popup-like but allowed)
    // 3. Fallback to standard redirect (might fail in webviews but correct for standard apps)

    const targetUrl = data.url

    try {
      if (window.top && window.top !== window) {
        window.top.location.href = targetUrl
        return
      }
    } catch (e) {
      console.warn("[v0] Cannot redirect top window (likely cross-origin iframe). Trying new tab...", e)

      // Fallback for v0 preview / cross-origin iframes: open in new tab
      // This avoids the 403 error by using a "real" browser tab
      const newWindow = window.open(targetUrl, "_blank")
      if (newWindow) {
        newWindow.focus()
        return
      }
    }

    window.location.href = targetUrl
  }
}

/**
 * Returns the default authenticated landing route.
 */
export const getDefaultRedirectPath = () => DEFAULT_REDIRECT_PATH

/**
 * Builds the callback URL used for email link confirmations.
 */
type BuildOAuthCallbackUrlOptions = {
  nextPath?: string | null
  baseUrlOverride?: string
}

export const buildOAuthCallbackUrl = (options: BuildOAuthCallbackUrlOptions = {}) => {
  const { nextPath, baseUrlOverride } = options
  return buildRedirectUrl(nextPath ?? DEFAULT_REDIRECT_PATH, baseUrlOverride)
}
