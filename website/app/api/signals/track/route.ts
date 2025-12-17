// Track user signals in real-time
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SignalTracker } from "@/lib/recommendation/signal-tracker"
import type { SignalEvent } from "@/lib/recommendation/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { postId, eventType, value } = body

    if (!postId || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await SignalTracker.trackSignal(user.id, postId, eventType as SignalEvent, value)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Track signal error:", error)
    return NextResponse.json({ error: "Failed to track signal" }, { status: 500 })
  }
}
