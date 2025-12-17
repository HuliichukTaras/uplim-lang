import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const alt = "Fantikx Post"
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: post } = await supabase
        .from("posts")
        .select(`
      caption,
      thumbnail_url,
      thumbnail_blurred_url,
      media_urls,
      is_nsfw,
      is_adult,
      likes_count,
      comments_count,
      profiles!posts_user_id_fkey (
        display_name,
        handle,
        avatar_url
      )
    `)
        .eq("id", id)
        .single()

    if (!post) {
        return new ImageResponse(
            (
                <div
                    style={{
                        background: "linear-gradient(135deg, #FF1B6B 0%, #FF758C 50%, #FF7EB3 100%)",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ fontSize: 60, color: "white", fontWeight: "bold" }}>Fantikx</div>
                    <div style={{ fontSize: 30, color: "rgba(255,255,255,0.8)", marginTop: 20 }}>
                        Content not available
                    </div>
                </div>
            ),
            { ...size }
        )
    }

    const profile = post.profiles as any
    const creatorName = profile?.display_name || profile?.handle || "Creator"
    const isNSFW = post.is_nsfw || post.is_adult
    const thumbnailUrl = isNSFW ? post.thumbnail_blurred_url : (post.thumbnail_url || post.media_urls?.[0])
    const caption = post.caption?.slice(0, 100) || "Exclusive content on Fantikx"

    return new ImageResponse(
        (
            <div
                style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: 60,
                    position: "relative",
                }}
            >
                {/* Background image with overlay */}
                {thumbnailUrl && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${thumbnailUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: 0.3,
                        }}
                    />
                )}

                {/* Gradient overlay */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)",
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Top: Logo and NSFW badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div
                            style={{
                                fontSize: 36,
                                fontWeight: "bold",
                                background: "linear-gradient(90deg, #FF1B6B, #FF758C)",
                                backgroundClip: "text",
                                color: "transparent",
                            }}
                        >
                            Fantikx
                        </div>
                        {isNSFW && (
                            <div
                                style={{
                                    background: "#FF1B6B",
                                    color: "white",
                                    padding: "8px 20px",
                                    borderRadius: 20,
                                    fontSize: 18,
                                    fontWeight: "bold",
                                }}
                            >
                                18+
                            </div>
                        )}
                    </div>

                    {/* Middle: Caption */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 48,
                                color: "white",
                                fontWeight: "bold",
                                lineHeight: 1.3,
                                maxWidth: "80%",
                            }}
                        >
                            {caption}
                        </div>
                    </div>

                    {/* Bottom: Creator info and stats */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            {profile?.avatar_url && (
                                <img
                                    src={profile.avatar_url}
                                    width={56}
                                    height={56}
                                    style={{ borderRadius: "50%", border: "3px solid #FF1B6B" }}
                                />
                            )}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
                                    {creatorName}
                                </div>
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>
                                    @{profile?.handle || "creator"}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: "flex", gap: 24 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ color: "#FF1B6B", fontSize: 24 }}>❤️</div>
                                <div style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                                    {post.likes_count || 0}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ color: "#FF1B6B", fontSize: 24 }}>💬</div>
                                <div style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                                    {post.comments_count || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    )
}
