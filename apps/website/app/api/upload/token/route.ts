import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("[v0] 🔑 Token generation request received")

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0] ❌ BLOB_READ_WRITE_TOKEN is not configured")
      return NextResponse.json({ error: "Blob storage is not configured" }, { status: 500 })
    }

    console.log("[v0] ✓ BLOB_READ_WRITE_TOKEN found")

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[v0] ❌ Supabase auth error:", authError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      console.error("[v0] ❌ No user found in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] ✓ User authenticated:", user.id)

    const body = (await request.json()) as HandleUploadBody
    const debugBody = body as HandleUploadBody & { pathname?: string; type?: string }
    console.log("[v0] 📦 Upload body:", { pathname: debugBody.pathname, type: debugBody.type })

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        console.log("[v0] 🎫 Generating token for pathname:", pathname)
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
          ],
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("[v0] ✅ Client upload completed:", blob.url)
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("[v0] ✓ Token generated successfully")
    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("[v0] ❌ Token generation error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to generate upload token", details: message }, { status: 500 })
  }
}
