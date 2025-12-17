import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const alt = "Fantikx Support"
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    let creatorName = "Creator"
    let avatarUrl: string | null = null

    try {
        const supabase = await createClient()
        const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, handle, avatar_url")
            .eq("id", id)
            .single()

        if (profile) {
            creatorName = profile.display_name || profile.handle || "Creator"
            avatarUrl = profile.avatar_url
        }
    } catch {
        // Fallback to default values
    }

    return new ImageResponse(
        (
            <div
                style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #2d1b4e 100%)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 60,
                }}
            >
                {/* Heart Animation Effect */}
                <div
                    style={{
                        position: "absolute",
                        width: 300,
                        height: 300,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)",
                        filter: "blur(40px)",
                    }}
                />

                {/* Creator Avatar or Heart */}
                <div
                    style={{
                        width: 160,
                        height: 160,
                        borderRadius: "50%",
                        background: avatarUrl
                            ? `url(${avatarUrl})`
                            : "linear-gradient(135deg, #EC4899, #F472B6)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: "6px solid #EC4899",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 80,
                        marginBottom: 40,
                        boxShadow: "0 20px 60px rgba(236, 72, 153, 0.5)",
                    }}
                >
                    {!avatarUrl && "❤️"}
                </div>

                {/* Title */}
                <div
                    style={{
                        fontSize: 52,
                        fontWeight: "bold",
                        color: "white",
                        textAlign: "center",
                        marginBottom: 20,
                    }}
                >
                    Support Received! 💖
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
                    Thank you for supporting {creatorName}
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
                        on
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
