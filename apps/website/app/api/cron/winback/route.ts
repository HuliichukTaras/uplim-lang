import { NextResponse } from "next/server"
import { digestAggregator } from "@/lib/email/digest-aggregator"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * Win-back cron job - runs daily or every few days
 * Sends re-engagement emails to inactive users
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Starting win-back email processing...")
    const result = await digestAggregator.processWinbackEmails()
    console.log(`[Cron] Win-back: ${result.queued} queued, ${result.skipped} skipped`)

    return NextResponse.json({
      success: true,
      message: "Win-back processing complete",
      ...result,
    })
  } catch (error) {
    console.error("[Cron] Error processing win-back emails:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
