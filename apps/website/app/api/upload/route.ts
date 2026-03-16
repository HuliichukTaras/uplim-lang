import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024 // 25MB hard limit to curb abuse
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Blob storage is not configured" }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: "File exceeds the maximum allowed size of 25MB" }, { status: 413 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 })
    }

    // Generate a safe filename
    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")

    // Upload to Vercel Blob using server-side token
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true, // Ensure uniqueness
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      uploadedBy: user.id,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
