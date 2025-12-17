import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const alt = "Fantikx Unlock"
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Try to get minimal post info (edge-compatible)
    let creatorName = "Creator"
    let contentType = "Content"

    try {
        const supabase = await createClient()
        const { data: post } = await supabase
            .from("posts")
            .select(`
        media_type,
        profiles!posts_user_id_fkey (
          display_name,
          handle
        )
      `)
            .eq("id", id)
            .single()

        if (post) {
            const profile = post.profiles as any
            creatorName = profile?.display_name || profile?.handle || "Creator"
            contentType = post.media_type === "video" ? "Video" : "Photo"
        }
    } catch {
        // Fallback to default values
    }

    return new ImageResponse(
        (
            <div
                style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 60,
                }}
            >
                {/* Success Icon */}
                <div
                    style={{
                        width: 150,
                        height: 150,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #10B981, #059669)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 80,
                        marginBottom: 40,
                        boxShadow: "0 20px 60px rgba(16, 185, 129, 0.4)",
                    }}
                >
                    ✓
                </div>

                {/* Title */}
                <div
                    style={{
                        fontSize: 56,
                        fontWeight: "bold",
                        color: "white",
                        textAlign: "center",
                        marginBottom: 20,
                    }}
                >
                    {contentType} Unlocked!
                </div>

                {/* Creator */}
                <div
                    style={{
                        fontSize: 32,
                        color: "rgba(255,255,255,0.8)",
                        textAlign: "center",
                        marginBottom: 40,
                    }}
                >
                    Exclusive content from {creatorName}
                </div>

                {/* Platform badge */}
                <div
                    style={{
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 20,
                        padding: "12px 30px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <span style={{ fontSize: 24, color: "rgba(255,255,255,0.6)" }}>
                        Powered by
                    </span>
                    <span
                        style={{
                            fontSize: 28,
                            fontWeight: "bold",
                            background: "linear-gradient(90deg, #FF1B6B, #FF758C)",
                            backgroundClip: "text",
                            color: "transparent",
                        }}
                    >
                        Fantikx
                    </span>
                </div>
            </div>
        ),
        { ...size }
    )
}
