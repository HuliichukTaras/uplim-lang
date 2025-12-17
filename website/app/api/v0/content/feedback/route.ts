import { recordModerationFeedback } from "@/lib/safety/adaptive-thresholds"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { contentId, systemDecision, moderatorDecision, systemScore, category } = body

    if (!contentId || !systemDecision || !moderatorDecision || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await recordModerationFeedback({
      contentId,
      systemDecision,
      moderatorDecision,
      systemScore: systemScore || 0,
      category,
      timestamp: new Date(),
    })

    if (!success) {
      return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Feedback API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
