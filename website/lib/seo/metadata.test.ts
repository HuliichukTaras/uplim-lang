import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_SEO, generateSEOMetadata, getDefaultOgImage, resolveOgImageUrl } from "./metadata"

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
  const ogUrl = firstOgImage?.url

  const firstTwitterImage = Array.isArray(first.twitter?.images)
    ? first.twitter.images[0]
    : first.twitter?.images

  const secondOgUrl = Array.isArray(second.openGraph?.images)
    ? second.openGraph.images[0]?.url
    : second.openGraph?.images?.url
  const secondTwitterImage = Array.isArray(second.twitter?.images)
    ? second.twitter.images[0]
    : second.twitter?.images

  assert.equal(ogUrl, resolveOgImageUrl(getDefaultOgImage(), DEFAULT_SEO.siteUrl))
  assert.equal(ogUrl, secondOgUrl)
  assert.equal(firstTwitterImage, secondTwitterImage)
})
