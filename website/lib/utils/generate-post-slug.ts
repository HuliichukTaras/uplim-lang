export function generatePostSlug(caption: string | null, postId: string): string {
  if (!caption) {
    return `post-${postId}`
  }

  const slug = caption
    .slice(0, 50)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `${slug}-${postId}`
}

export function extractPostIdFromSlug(slug: string): string {
  return slug.split("-").pop() || slug
}
