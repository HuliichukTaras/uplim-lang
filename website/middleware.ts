import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { locales, defaultLocale } from "./i18n/config"

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
})

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // AI & SEO files - bypass i18n middleware
  if (
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/ai.txt" ||
    pathname === "/ai" ||
    pathname === "/video-sitemap.xml" ||
    pathname === "/image-sitemap.xml" ||
    pathname === "/trust.json" ||
    pathname === "/answers.json" ||
    pathname === "/semantic.json" ||
    pathname === "/policy.json" ||
    pathname === "/content.map.json" ||
    pathname === "/ai-feed.json" ||
    pathname === "/license-ai.txt"
  ) {
    return NextResponse.next()
  }

  // Redirect locale-prefixed SEO files to root
  const seoFileMatch = pathname.match(/^\/([\w-]+)\/(robots\.txt|sitemap\.xml|llms\.txt|llms-full\.txt|ai\.txt|video-sitemap\.xml|image-sitemap\.xml|trust\.json|answers\.json|semantic\.json|policy\.json|content\.map\.json|ai-feed\.json|license-ai\.txt)$/)
  if (seoFileMatch && locales.includes(seoFileMatch[1] as any)) {
    const file = seoFileMatch[2]
    return NextResponse.redirect(new URL(`/${file}`, request.url), 301)
  }

  // API routes should not be processed by intl middleware
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next()
  }

  // 1. Run next-intl middleware first to handle locale detection and redirection
  const response = intlMiddleware(request)

  // 2. Run Supabase auth check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        // Update both request and response cookies
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Add pathname to headers for client-side use if needed
  response.headers.set("x-pathname", request.nextUrl.pathname)

  // Protected routes check
  if (
    pathname.match(
      /\/(en|de|uk|es|fr|ja|ko|pt|ru|tr|zh-CN|zh-TW)\/(feed|messages|upload|wallet|settings|notifications|favorites|live|dashboard)/,
    )
  ) {
    if (!user) {
      const locale = pathname.split("/")[1] || defaultLocale
      // Redirect to login page with locale
      return NextResponse.redirect(new URL(`/${locale}`, request.url))
    }
  }

  // Redirect authenticated users from landing page to feed
  if (pathname.match(/^\/(en|de|uk|es|fr|ja|ko|pt|ru|tr|zh-CN|zh-TW)\/?$/) && user) {
    const locale = pathname.split("/")[1] || defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/feed`, request.url))
  }

  // Check if this is a potential username URL (/{locale}/{username})
  // Rewrite to /profile/{username} internally while keeping the clean URL
  const usernameMatch = pathname.match(/^\/(en|de|uk|es|fr|ja|ko|pt|ru|tr|zh-CN|zh-TW)\/([a-zA-Z0-9._-]{3,30})$/)
  if (usernameMatch) {
    const locale = usernameMatch[1]
    const potentialUsername = usernameMatch[2]

    // Reserved paths that should NOT be rewritten to profile
    const reservedPaths = new Set([
      "feed", "discover", "explore", "search", "post", "posts", "upload", "live", "reels", "stories",
      "messages", "notifications", "wallet", "favorites", "dashboard", "analytics", "promote", "badges",
      "unlock", "support", "about", "help", "faq", "contact", "pricing", "features", "legal", "terms",
      "privacy", "safety", "careers", "press", "blog", "auth", "login", "signup", "register", "logout",
      "settings", "profile", "user", "account", "api", "admin", "static", "assets", "images", "media",
      "ai", "sitemap", "robots", "home", "index", "new", "edit", "delete", "create", "update",
      "suggested", "unsubscribed"
    ])

    // Only rewrite if NOT a reserved path
    if (!reservedPaths.has(potentialUsername.toLowerCase())) {
      // Rewrite to profile route internally (URL stays clean)
      const url = request.nextUrl.clone()
      url.pathname = `/${locale}/profile/${potentialUsername}`
      return NextResponse.rewrite(url, {
        headers: response.headers,
      })
    }
  }

  return response
}

export const config = {
  // Matcher ignoring `_next` and static files
  matcher: [
    // Match all pathnames except for:
    // - API routes (/api/*)
    // - Next.js internals (_next/*)
    // - Static files (images, fonts, etc.)
    // - Metadata files (favicon.ico)
    "/((?!api|_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
}
