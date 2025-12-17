import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const title = searchParams.get("title") || "Platform for Creators with No Limits"
    const description = searchParams.get("description") || "Your content. Your rules. No bans. No restrictions."

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "10%",
            width: "300px",
            height: "300px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            left: "60%",
            width: "200px",
            height: "200px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />

        {/* Logo text */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            fontStyle: "italic",
            color: "white",
            marginBottom: "32px",
            textShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          Fantikx
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            maxWidth: "700px",
            lineHeight: 1.2,
            marginBottom: "24px",
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.9)",
            maxWidth: "600px",
            lineHeight: 1.5,
            marginBottom: "40px",
          }}
        >
          {description}
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 24px",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "50px",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 600, color: "white" }}>No Limits</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 24px",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "50px",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 600, color: "white" }}>No Shadow Bans</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 24px",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "50px",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 600, color: "white" }}>Your Rules</span>
          </div>
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "60px",
            fontSize: 24,
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          fantikx.com
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e) {
    console.error("OG image generation failed:", e)
    return new Response("Failed to generate image", { status: 500 })
  }
}
