import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const alt = "Fantikx Profile"
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from("profiles")
        .select(`
      id,
      handle,
      display_name,
      bio,
      avatar_url,
      cover_url,
      is_creator,
      followers_count,
      following_count
    `)
        .or(`handle.eq.${username},username.eq.${username}`)
        .single()

    if (!profile) {
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
                        Profile not found
                    </div>
                </div>
            ),
            { ...size }
        )
    }

    const displayName = profile.display_name || profile.handle || "Creator"
    const bio = profile.bio?.slice(0, 120) || "Content creator on Fantikx"

    return new ImageResponse(
        (
            <div
                style={{
                    background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                }}
            >
                {/* Cover background */}
                {profile.cover_url && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${profile.cover_url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: 0.4,
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
                        background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 100%)",
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        padding: 60,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* Logo top right */}
                    <div
                        style={{
                            position: "absolute",
                            top: 40,
                            right: 60,
                            fontSize: 32,
                            fontWeight: "bold",
                            background: "linear-gradient(90deg, #FF1B6B, #FF758C)",
                            backgroundClip: "text",
                            color: "transparent",
                        }}
                    >
                        Fantikx
                    </div>

                    {/* Avatar */}
                    <div
                        style={{
                            width: 160,
                            height: 160,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #FF1B6B, #FF758C)",
                            padding: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                width={150}
                                height={150}
                                style={{ borderRadius: "50%", objectFit: "cover" }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 150,
                                    height: 150,
                                    borderRadius: "50%",
                                    background: "#2a2a4a",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 60,
                                    color: "white",
                                    fontWeight: "bold",
                                }}
                            >
                                {displayName[0]?.toUpperCase() || "?"}
                            </div>
                        )}
                    </div>

                    {/* Name and handle */}
                    <div
                        style={{
                            marginTop: 24,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ fontSize: 48, color: "white", fontWeight: "bold" }}>
                                {displayName}
                            </div>
                            {profile.is_creator && (
                                <div
                                    style={{
                                        background: "linear-gradient(90deg, #FF1B6B, #FF758C)",
                                        color: "white",
                                        padding: "6px 16px",
                                        borderRadius: 20,
                                        fontSize: 18,
                                        fontWeight: "bold",
                                    }}
                                >
                                    Creator
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
                            @{profile.handle}
                        </div>
                    </div>

                    {/* Bio */}
                    <div
                        style={{
                            marginTop: 20,
                            fontSize: 22,
                            color: "rgba(255,255,255,0.8)",
                            textAlign: "center",
                            maxWidth: 800,
                            lineHeight: 1.4,
                        }}
                    >
                        {bio}
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 60, marginTop: 32 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ fontSize: 36, color: "white", fontWeight: "bold" }}>
                                {profile.followers_count || 0}
                            </div>
                            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }}>Followers</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ fontSize: 36, color: "white", fontWeight: "bold" }}>
                                {profile.following_count || 0}
                            </div>
                            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }}>Following</div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    )
}
