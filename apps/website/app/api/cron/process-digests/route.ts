import { NextResponse } from "next/server"
import { digestAggregator } from "@/lib/email/digest-aggregator"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * Hourly cron job to process daily digests
 * Runs every hour and queues digests for users whose digest_hour matches current hour in their timezone
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Starting daily digest processing...")
    const result = await digestAggregator.processDailyDigests()
    console.log(`[Cron] Daily digests: ${result.queued} queued, ${result.skipped} skipped`)

    return NextResponse.json({
      success: true,
      message: "Daily digest processing complete",
      ...result,
    })
  } catch (error) {
    console.error("[Cron] Error processing digests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
