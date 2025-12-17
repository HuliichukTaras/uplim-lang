import { type NextRequest, NextResponse } from "next/server"
import { analyzeContent } from "@/lib/safety/unified-analyzer"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

interface AnalyzeResponse {
  request_id: string
  status: "ok" | "error"
  decision?: "block" | "review" | "allow"
  reason?: string
  confidence?: number
  flags?: {
    csam: boolean
    bestiality: boolean
    explicit_sexual_activity: boolean
    full_nudity: boolean
    violence: boolean
    gore: boolean
    dismemberment: boolean
    child: boolean
    animal: boolean
  }
  scores?: {
    safe: number
    suggestive: number
    nudity: number
    sexual_activity: number
  }
  code?: string
  message?: string
  post_id?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  const requestId = crypto.randomUUID()

  try {
    const contentType = req.headers.get("content-type")
    if (!contentType?.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          request_id: requestId,
          status: "error",
          code: "INVALID_CONTENT_TYPE",
          message: "Request must be multipart/form-data",
        },
        { status: 400 },
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const postId = formData.get("post_id") as string | null

    if (!file) {
      return NextResponse.json(
        {
          request_id: requestId,
          status: "error",
          code: "MISSING_FILE",
          message: "No file provided",
        },
        { status: 400 },
      )
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        {
          request_id: requestId,
          status: "error",
          code: "UNSUPPORTED_MIME",
          message: `Unsupported MIME type: ${file.type}`,
        },
        { status: 400 },
      )
    }

    const maxSizes: Record<string, number> = {
      "image/jpeg": 20 * 1024 * 1024,
      "image/png": 20 * 1024 * 1024,
      "image/webp": 20 * 1024 * 1024,
      "video/mp4": 500 * 1024 * 1024,
      "video/webm": 500 * 1024 * 1024,
    }

    if (file.size > (maxSizes[file.type] || 20 * 1024 * 1024)) {
      return NextResponse.json(
        {
          request_id: requestId,
          status: "error",
          code: "FILE_TOO_LARGE",
          message: "File size exceeds limit",
        },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let contentTypeCategory: "image" | "video" | "text" = "image"
    if (file.type.startsWith("video/")) {
      contentTypeCategory = "video"
    }

    const result = await analyzeContent(buffer, contentTypeCategory, file.type)

    if (postId) {
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          {
            cookies: {
              getAll() {
                return cookies().getAll()
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) => cookies().set(name, value, options))
                } catch {
                  // ignore cookie errors in server context
                }
              },
            },
          },
        )

        const { error } = await supabase
          .from("posts")
          .update({
            is_nsfw: result.flags?.full_nudity || result.flags?.explicit_sexual_activity,
            is_adult: result.decision === "block",
            moderation_status: result.decision,
            moderation_meta: {
              request_id: requestId,
              analyzed_at: new Date().toISOString(),
              scores: result.scores,
              flags: result.flags,
              confidence: result.confidence,
            },
            blur_required: result.flags?.full_nudity || result.flags?.explicit_sexual_activity,
          })
          .eq("id", postId)

        if (error) {
          console.error("[v0] Supabase update error:", error)
        }
      } catch (error) {
        console.error("[v0] Failed to save moderation results:", error)
      }
    }

    return NextResponse.json({
      request_id: requestId,
      status: "ok",
      decision: result.decision,
      reason: result.reason,
      confidence: result.confidence,
      flags: result.flags,
      scores: result.scores,
      post_id: postId,
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      {
        request_id: requestId,
        status: "error",
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
