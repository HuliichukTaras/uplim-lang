import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
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

    const { messageId, mode } = await request.json()

    if (!messageId || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Get message to verify ownership
    const { data: message, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("sender_id, deleted_by")
      .eq("id", messageId)
      .single()

    if (fetchError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    if (mode === "everyone") {
      // Only sender can delete for everyone
      if (message.sender_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const { error: updateError } = await supabaseAdmin
        .from("messages")
        .update({ deleted_for_everyone: true })
        .eq("id", messageId)

      if (updateError) throw updateError
    } else if (mode === "me") {
      // Add user to deleted_by array
      const currentDeletedBy = message.deleted_by || []
      if (!currentDeletedBy.includes(user.id)) {
        const { error: updateError } = await supabaseAdmin
          .from("messages")
          .update({ deleted_by: [...currentDeletedBy, user.id] })
          .eq("id", messageId)

        if (updateError) throw updateError
      }
    } else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
