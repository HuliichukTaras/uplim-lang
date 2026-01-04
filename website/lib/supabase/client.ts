import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )

    // This handles the "Failed to fetch" error when the placeholder URL is unreachable
    const mockClient = createSupabaseBrowserClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseKey || "placeholder",
    )

    // Override auth methods to return null session/user without making network requests
    const safeClient = new Proxy(mockClient, {
      get(target, prop) {
        if (prop === "auth") {
          return {
            ...target.auth,
            getUser: async () => ({ data: { user: null }, error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          }
        }
        return Reflect.get(target, prop)
      },
    })

    return safeClient
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseKey)
}

export const createBrowserClient = createClient
