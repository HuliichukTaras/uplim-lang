import { ImageResponse } from "next/og"
import { getBadgeById, BADGE_TIER_COLORS } from "@/lib/badges"

export const runtime = "edge"
export const alt = "Fantikx Badge"
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const badge = getBadgeById(id)

    if (!badge) {
        return new ImageResponse(
            (
                <div
                    style={{
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ fontSize: 60, color: "white", fontWeight: "bold" }}>Fantikx</div>
                    <div style={{ fontSize: 30, color: "rgba(255,255,255,0.7)", marginTop: 20 }}>
                        Badge not found
                    </div>
                </div>
            ),
            { ...size }
        )
    }

    const tierColors = BADGE_TIER_COLORS[badge.tier]

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
                {/* Badge Icon Circle */}
                <div
                    style={{
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        background: tierColors.bg,
                        border: `8px solid ${tierColors.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 100,
                        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    }}
                >
                    {badge.icon}
                </div>

                {/* Badge Name */}
                <div
                    style={{
                        marginTop: 40,
                        fontSize: 56,
                        fontWeight: "bold",
                        color: "white",
                        textAlign: "center",
                    }}
                >
                    {badge.name}
                </div>

                {/* Tier Badge */}
                <div
                    style={{
                        marginTop: 20,
                        background: tierColors.bg,
                        color: tierColors.text,
                        padding: "10px 30px",
                        borderRadius: 30,
                        fontSize: 24,
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: 2,
                    }}
                >
                    {badge.tier}
                </div>

                {/* Short Description */}
                <div
                    style={{
                        marginTop: 30,
                        fontSize: 28,
                        color: "rgba(255,255,255,0.8)",
                        textAlign: "center",
                        maxWidth: 800,
                    }}
                >
                    {badge.shortDescription}
                </div>

                {/* Fantikx Branding */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 40,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                    }}
                >
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
                    <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)" }}>
                        Achievement Badge
                    </div>
                </div>
            </div>
        ),
        { ...size }
    )
}
