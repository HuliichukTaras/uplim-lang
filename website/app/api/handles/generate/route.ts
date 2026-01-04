import { NextResponse } from "next/server"
import { generateUniqueHandleServer } from "@/lib/utils/handle"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { baseName, currentUserId } = body || {}

    if (!baseName || typeof baseName !== "string") {
      return NextResponse.json({ error: "baseName is required" }, { status: 400 })
    }

    const handle = await generateUniqueHandleServer(baseName, currentUserId)
    return NextResponse.json({ handle })
  } catch (err) {
    console.error("Error generating handle:", err)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
