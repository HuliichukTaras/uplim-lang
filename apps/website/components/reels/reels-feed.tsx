"use client"

import { useState, useRef, useEffect } from "react"
import { ReelPlayer } from "./reel-player"
import { useSwipeable } from "react-swipeable"

interface Reel {
  id: string
  caption: string
  video_url: string
  media_urls: string[]
  likes_count: number
  comments_count: number
  views_count: number
  user_id: string
  profiles: {
    id: string
    handle: string
    display_name: string
    avatar_url: string
  }
}

export function ReelsFeed({ initialReels, userId }: { initialReels: Reel[]; userId: string }) {
  const [reels, setReels] = useState(initialReels)
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const goToNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handlers = useSwipeable({
    onSwipedUp: goToNext,
    onSwipedDown: goToPrevious,
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  // Scroll to current reel
  useEffect(() => {
    if (containerRef.current) {
      const reelElement = containerRef.current.children[currentIndex] as HTMLElement
      if (reelElement) {
        reelElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        goToNext()
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        goToPrevious()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, reels.length])

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No reels yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black flex justify-center">
      <div
        {...handlers}
        ref={containerRef}
        className="w-full max-w-[560px] h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative bg-black shadow-2xl"
      >
        {reels.map((reel, index) => (
          <div key={reel.id} className="h-full w-full snap-start snap-always relative">
            <ReelPlayer reel={reel} isActive={index === currentIndex} userId={userId} />
          </div>
        ))}
      </div>
    </div>
  )
}
