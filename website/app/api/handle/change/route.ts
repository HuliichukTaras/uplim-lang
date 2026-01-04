import { createClient } from "@/lib/supabase/server"
import { changeHandleServer } from "@/lib/utils/handle-server"
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

    const { newHandle } = await request.json()

    if (!newHandle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 })
    }

    const result = await changeHandleServer(user.id, newHandle)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error changing handle:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
