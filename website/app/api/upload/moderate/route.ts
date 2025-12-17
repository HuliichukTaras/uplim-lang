import { del } from "@vercel/blob"
import { NextResponse, type NextRequest } from "next/server"
import { moderateContent } from "@/lib/moderation"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const { url, mediaType } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing blob URL" },
        { status: 400 },
      )
    }

    const normalizedType: "image" | "video" = mediaType === "video" ? "video" : "image"
    const moderation = await moderateContent(url, normalizedType)

    if (moderation.shouldReject) {
      try {
        await del(url)
      } catch (deleteError) {
        console.error("[v0] Failed to delete rejected blob:", deleteError)
      }

      return NextResponse.json(
        {
          success: false,
          error: moderation.reason || "Content rejected by moderation",
          moderation: {
            isNsfw: moderation.isNsfw,
            confidence: moderation.metadata?.confidence ?? 0,
            blurLevel: moderation.blurLevel,
            metadata: moderation.metadata,
            shouldReject: moderation.shouldReject,
            reason: moderation.reason,
          },
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      success: true,
      moderation: {
        isNsfw: moderation.isNsfw,
        confidence: moderation.metadata?.confidence ?? 0,
        blurLevel: moderation.blurLevel,
        metadata: moderation.metadata,
        shouldReject: moderation.shouldReject,
        reason: moderation.reason,
      },
    })
  } catch (error) {
    console.error("[v0] Moderation error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      { success: false, error: "Moderation failed", details: message },
      { status: 500 },
    )
  }
}
