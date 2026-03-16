import { createClient } from "@/lib/supabase/server"
import { createConfigAwareErrorResponse } from "@/lib/api/error-response"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { followingId } = await request.json()

    if (!followingId) {
      return NextResponse.json({ error: "Missing followingId" }, { status: 400 })
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: followingId,
    })

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already following" })
      }
      throw error
    }

    const notificationsUrl = new URL("/api/notifications/create", request.url)

    fetch(notificationsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: followingId,
        actorId: user.id,
        type: "new_follower",
        metadata: {},
      }),
    }).catch((e) => console.error("[v0] Notification error:", e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Follow error:", error)
    return createConfigAwareErrorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { followingId } = await request.json()

    if (!followingId) {
      return NextResponse.json({ error: "Missing followingId" }, { status: 400 })
    }

    const { error } = await supabase.from("follows").delete().match({
      follower_id: user.id,
      following_id: followingId,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unfollow error:", error)
    return createConfigAwareErrorResponse(error)
  }
}
