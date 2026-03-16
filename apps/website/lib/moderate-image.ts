import { moderateContent } from "@/lib/moderation"

/**
 * Wrapper for the content moderation logic.
 * This file exists to provide a direct import for the image moderation function
 * compatible with the user's request.
 */
export async function moderateImage(imageUrl: string) {
  return moderateContent(imageUrl, "image")
}
