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

    const { conversationId, action } = await request.json()

    if (!conversationId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!['accept', 'decline', 'block'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user is participant in this conversation
    const { data: participant } = await supabaseAdmin
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })
    }

    // Update conversation status
    const newStatus = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'blocked'
    
    const { error } = await supabaseAdmin
      .from("conversations")
      .update({ status: newStatus })
      .eq("id", conversationId)

    if (error) {
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error("Error updating message request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
