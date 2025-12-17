import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeUrl(url: string): string {
  if (!url) return ""
  let cleanUrl = url.trim()

  // If no protocol is present, prepend https://
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`
  }

  try {
    // Attempt to validate structure, but return the cleaned URL regardless to be safe
    new URL(cleanUrl)
    return cleanUrl
  } catch (e) {
    // Fallback for very malformed URLs (e.g. spaces) to avoid crashing
    return cleanUrl
  }
}
