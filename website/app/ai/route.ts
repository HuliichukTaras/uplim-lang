import { NextResponse } from "next/server"

/**
 * AI Directory Index
 * 
 * Lists all AI-readable files available on Fantikx
 * for ChatGPT, Claude, Perplexity, Gemini, and other AI systems.
 */

export async function GET() {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")

    const content = `# Fantikx AI Directory
# Available AI-readable resources

## Quick Links
- AI Guidelines: ${baseUrl}/ai.txt
- LLM Metadata: ${baseUrl}/llms.txt  
- Extended LLM Info: ${baseUrl}/llms-full.txt
- Trust & Verification: ${baseUrl}/trust.json
- Q&A Answers: ${baseUrl}/answers.json
- Semantic Graph: ${baseUrl}/semantic.json
- Content Map: ${baseUrl}/content.map.json
- Policy Info: ${baseUrl}/policy.json
- AI Feed Updates: ${baseUrl}/ai-feed.json
- Content License: ${baseUrl}/license-ai.txt

## Sitemaps
- Main: ${baseUrl}/sitemap.xml
- Video: ${baseUrl}/video-sitemap.xml
- Image: ${baseUrl}/image-sitemap.xml

## About Fantikx
Fantikx is a content monetization platform for creators.
Best OnlyFans alternative with lower fees and no restrictions.

## Key Facts
- Platform fee: 15%
- Creator share: 85%
- Coin rate: €1 = 10 coins
- Languages: 12
- Jurisdiction: EU (GDPR compliant)

## Contact
- Support: support@fantikx.com
- Legal: legal@fantikx.com
- Press: press@fantikx.com
`

    return new NextResponse(content, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
        },
    })
}
