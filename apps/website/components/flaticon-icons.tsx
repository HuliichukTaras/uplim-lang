"use client"
import { cn } from "@/lib/utils"

interface IconProps {
  className?: string
  filled?: boolean
  onClick?: () => void
}

export function HeartIcon({ className, filled, onClick }: IconProps) {
  return (
    <svg
      onClick={onClick}
      className={cn("w-6 h-6 transition-colors cursor-pointer", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Zm-3.585,18.4a2.973,2.973,0,0,1-3.83,0C4.947,16.006,2,11.87,2,8.967a4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,11,8.967a1,1,0,0,0,2,0,4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,22,8.967C22,11.87,19.053,16.006,13.915,20.313Z" />
    </svg>
  )
}

export function CommentIcon({ className, onClick }: IconProps) {
  return (
    <svg
      onClick={onClick}
      className={cn("w-6 h-6 transition-colors cursor-pointer", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20,0H4A4,4,0,0,0,0,4V16a4,4,0,0,0,4,4H6.9l4.451,3.763a1,1,0,0,0,1.292,0L17.1,20H20a4,4,0,0,0,4-4V4A4,4,0,0,0,20,0Zm2,16a2,2,0,0,1-2,2H16.9a2,2,0,0,0-1.291.473L12,21.69,8.193,18.473h0A2,2,0,0,0,6.9,18H4a2,2,0,0,1-2-2V4A2,2,0,0,1,4,2H20a2,2,0,0,1,2,2Z" />
      <path d="M7,7h5a1,1,0,0,0,0-2H7A1,1,0,0,0,7,7Z" />
      <path d="M17,9H7a1,1,0,0,0,0,2H17a1,1,0,0,0,0-2Z" />
      <path d="M17,13H7a1,1,0,0,0,0,2H17a1,1,0,0,0,0-2Z" />
    </svg>
  )
}

export function StarIcon({ className, filled, onClick }: IconProps) {
  return (
    <svg
      onClick={onClick}
      className={cn("w-6 h-6 transition-colors cursor-pointer", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M23.836,8.794a3.179,3.179,0,0,0-3.067-2.226H16.4L15.073,2.432a3.227,3.227,0,0,0-6.146,0L7.6,6.568H3.231a3.227,3.227,0,0,0-1.9,5.832L4.887,15l-1.352,4.187A3.178,3.178,0,0,0,4.719,22.8a3.177,3.177,0,0,0,3.8-.019L12,20.219l3.482,2.559a3.227,3.227,0,0,0,4.983-3.591L19.113,15l3.56-2.6A3.177,3.177,0,0,0,23.836,8.794Zm-2.343,1.991-4.144,3.029a1,1,0,0,0-.362,1.116L18.562,19.8a1.227,1.227,0,0,1-1.895,1.365l-4.075-3a1,1,0,0,0-1.184,0l-4.075,3a1.227,1.227,0,0,1-1.9-1.365L7.013,14.93a1,1,0,0,0-.362-1.116L2.507,10.785a1.227,1.227,0,0,1,.724-2.217h5.1a1,1,0,0,0,.952-.694l1.55-4.831a1.227,1.227,0,0,1,2.336,0l1.55,4.831a1,1,0,0,0,.952.694h5.1a1.227,1.227,0,0,1,.724,2.217Z" />
    </svg>
  )
}

export function ShareIcon({ className, onClick }: IconProps) {
  return (
    <svg
      onClick={onClick}
      className={cn("w-6 h-6 transition-colors cursor-pointer", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.333,14.667a4.66,4.66,0,0,0-3.839,2.024L8.985,13.752a4.574,4.574,0,0,0,.005-3.488l6.5-2.954a4.66,4.66,0,1,0-.827-2.643,4.633,4.633,0,0,0,.08.786L7.833,8.593a4.668,4.668,0,1,0-.015,6.827l6.928,3.128a4.736,4.736,0,0,0-.079.785,4.667,4.667,0,1,0,4.666-4.666ZM19.333,2a2.667,2.667,0,1,1-2.666,2.667A2.669,2.669,0,0,1,19.333,2ZM4.667,14.667A2.667,2.667,0,1,1,7.333,12,2.67,2.67,0,0,1,4.667,14.667ZM19.333,22A2.667,2.667,0,1,1,22,19.333,2.669,2.669,0,0,1,19.333,22Z" />
    </svg>
  )
}

// Експорт для зворотної сумісності
export const TelloosLikeIcon = HeartIcon
export const TelloosCommentIcon = CommentIcon
export const TelloosFavoriteIcon = StarIcon
export const TelloosShareIcon = ShareIcon
