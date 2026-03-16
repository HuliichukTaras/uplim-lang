import { NextResponse } from "next/server"
import { digestAggregator } from "@/lib/email/digest-aggregator"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * Weekly cron job to process weekly digests
 * Should be scheduled to run once per week (e.g., Sunday evening)
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Starting weekly digest processing...")
    const result = await digestAggregator.processWeeklyDigests()
    console.log(`[Cron] Weekly digests: ${result.queued} queued, ${result.skipped} skipped`)

    return NextResponse.json({
      success: true,
      message: "Weekly digest processing complete",
      ...result,
    })
  } catch (error) {
    console.error("[Cron] Error processing weekly digests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
