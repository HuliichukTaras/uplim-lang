"use client"

import { useState } from "react"

const colors = ["#00d9ff", "#00ffff", "#ff1493", "#7c3aed", "#ffd700"]

export function DynamicGradientOverlay() {
  const [gradient] = useState(() => {
    const shuffled = [...colors].sort(() => Math.random() - 0.5)
    const stops = shuffled
      .map((color, idx) => {
        const position = (idx / (shuffled.length - 1)) * 100
        return `${color} ${position}%`
      })
      .join(", ")
    return `linear-gradient(135deg, ${stops})`
  })

  return (
    <div
      className="absolute inset-0 animate-gradient"
      style={{
        background: gradient,
        opacity: 0.5,
        backgroundSize: "200% 200%",
        filter: "blur(5px)",
      }}
    />
  )
}
