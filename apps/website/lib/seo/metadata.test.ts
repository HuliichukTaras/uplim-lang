import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_SEO, generateSEOMetadata, getDefaultOgImage, resolveOgImageUrl } from "./metadata"

function getImageUrl(image: unknown): string | undefined {
  if (!image) return undefined
  if (typeof image === "string") return image
  if (typeof image === "object" && image !== null && "url" in image) {
    return (image as { url?: string }).url
  }
  return undefined
}

test("generateSEOMetadata consistently resolves the default OG image", () => {
  const baseMetadataProps = {
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    url: "/",
  }

  const first = generateSEOMetadata(baseMetadataProps)
  const second = generateSEOMetadata(baseMetadataProps)

  const firstOgImage = Array.isArray(first.openGraph?.images)
    ? first.openGraph.images[0]
    : first.openGraph?.images
  const ogUrl = getImageUrl(firstOgImage)

  const firstTwitterImage = Array.isArray(first.twitter?.images)
    ? first.twitter.images[0]
    : first.twitter?.images

  const secondOgUrl = Array.isArray(second.openGraph?.images)
    ? getImageUrl(second.openGraph.images[0])
    : getImageUrl(second.openGraph?.images)
  const secondTwitterImage = Array.isArray(second.twitter?.images)
    ? second.twitter.images[0]
    : second.twitter?.images

  assert.equal(ogUrl, resolveOgImageUrl(getDefaultOgImage(), DEFAULT_SEO.siteUrl))
  assert.equal(ogUrl, secondOgUrl)
  assert.equal(firstTwitterImage, secondTwitterImage)
})
