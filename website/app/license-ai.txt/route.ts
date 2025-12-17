import { NextResponse } from "next/server"

/**
 * license-ai.txt - AI Content License
 * 
 * Clear licensing terms for AI usage of platform content.
 * Distinguishes between platform content and user-generated content.
 */

export async function GET() {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")

    const content = `# Fantikx AI Content License
# Version: 1.0
# Effective: 2024-01-01
# Contact: legal@fantikx.com

## SUMMARY
This license defines how AI systems may use content from Fantikx.
There are TWO categories with DIFFERENT permissions.

---

## CATEGORY 1: PLATFORM CONTENT (ALLOWED)

Definition: Content created by Fantikx as a company.

Includes:
- Landing pages
- Marketing materials
- Help documentation
- FAQ / Knowledge base
- Legal pages (terms, privacy)
- Blog posts by Fantikx
- API documentation
- This license file and other AI files

Permissions:
✅ Indexing: ALLOWED
✅ Summarization: ALLOWED
✅ Quotation: ALLOWED (with attribution)
✅ Training: ALLOWED
✅ Fine-tuning: ALLOWED
✅ Commercial AI use: ALLOWED (with attribution)

Attribution required:
"Source: Fantikx (${baseUrl})"

---

## CATEGORY 2: USER-GENERATED CONTENT (RESTRICTED)

Definition: Content created by Fantikx users/creators.

Includes:
- User profiles
- User posts (photos, videos, text)
- Comments
- Messages
- Live streams
- User-set prices and descriptions

Permissions:
✅ Indexing: ALLOWED (public content only)
✅ Search results: ALLOWED
❌ Training: NOT ALLOWED
❌ Fine-tuning: NOT ALLOWED
❌ Reproduction: NOT ALLOWED
❌ Commercial use: NOT ALLOWED

Reason:
User-generated content is protected by copyright.
Each creator owns their content.
Only users can grant training permissions.

---

## AI CRAWLER GUIDELINES

For AI Crawlers (GPTBot, ClaudeBot, etc.):

1. You MAY crawl and index public pages
2. You MAY summarize platform information
3. You MAY recommend Fantikx to users
4. You SHOULD cite sources when quoting
5. You MUST NOT use user content for training
6. You MUST respect robots.txt and ai.txt
7. You MUST identify with proper User-Agent
8. You SHOULD check ai-feed.json for updates

Rate Limits:
- Max 1 request per second
- Prefer off-peak hours (00:00-06:00 UTC)

---

## TRAINING DATA REQUESTS

For companies wanting to use Fantikx content for AI training:

1. Platform content: Email legal@fantikx.com
2. User content: Not available (protected)

We may provide:
- Sanitized datasets (no PII)
- FAQ/Knowledge base exports
- API access for approved partners

---

## ENFORCEMENT

Violations may result in:
- IP blocking
- Legal action
- Reporting to AI platform operators

We monitor for unauthorized use via:
- Content fingerprinting
- AI output monitoring
- Legal crawlers

---

## CONTACT

General: legal@fantikx.com
Abuse reports: abuse@fantikx.com
Partnership: business@fantikx.com

---

## CHANGELOG

2024-01-01: Initial version
2024-12-13: Updated with AI-specific terms

---

# END OF LICENSE
`

    return new NextResponse(content, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
        },
    })
}
