import { NextResponse } from "next/server"

const CONFIG_ERROR_MESSAGES: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "Supabase is not configured",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase is not configured",
  SUPABASE_SERVICE_ROLE_KEY: "Supabase is not configured",
  BLOB_READ_WRITE_TOKEN: "Blob storage is not configured",
  RESEND_API_KEY: "Email service is not configured",
}

export function getConfigErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null
  }

  if (error.message === "supabaseUrl is required.") {
    return "Supabase is not configured"
  }

  const missingEnvPrefix = "Missing required environment variable:"
  if (!error.message.startsWith(missingEnvPrefix)) {
    return null
  }

  const envName = error.message.slice(missingEnvPrefix.length).trim()
  return CONFIG_ERROR_MESSAGES[envName] ?? "A required service is not configured"
}

export function createConfigAwareErrorResponse(error: unknown, fallbackMessage = "Internal server error") {
  const configErrorMessage = getConfigErrorMessage(error)

  if (configErrorMessage) {
    return NextResponse.json({ error: configErrorMessage }, { status: 500 })
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 })
}
