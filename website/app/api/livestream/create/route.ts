import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    // Get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log("[v0] Create livestream - User:", user?.id, "Auth error:", authError)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, stream_url, thumbnail_url } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Check if user already has an active livestream
    const { data: existingStream } = await supabase
      .from("livestreams")
      .select("id")
      .eq("creator_id", user.id)
      .eq("is_live", true)
      .maybeSingle()

    if (existingStream) {
      return NextResponse.json(
        { error: "You already have an active livestream" },
        { status: 400 }
      )
    }

    console.log("[v0] Creating livestream for user:", user.id, "Title:", title)

    // Create new livestream
    const { data: livestream, error: createError } = await supabase
      .from("livestreams")
      .insert({
        creator_id: user.id,
        title,
        description,
        stream_url,
        thumbnail_url,
        is_live: true,
      })
      .select()
      .single()

    if (createError) {
      console.error("[v0] Error creating livestream:", createError)
      return NextResponse.json(
        { error: "Failed to create livestream: " + createError.message },
        { status: 500 }
      )
    }

    console.log("[v0] Livestream created successfully:", livestream.id)

    return NextResponse.json({ livestream })
  } catch (error) {
    console.error("[v0] Livestream creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
