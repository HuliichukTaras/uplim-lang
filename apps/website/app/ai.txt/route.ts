import { NextResponse } from "next/server"

export async function GET() {
  const aiTxt = `# AI.txt for Fantikx - Content Usage Policy
# Generated: ${new Date().toISOString()}
# Specification: https://ai-txt.org/

# GENERAL POLICY
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /*/feed
Disallow: /*/messages
Disallow: /*/wallet
Disallow: /*/settings
Disallow: /*/dashboard
Disallow: /*/notifications
Disallow: /*/favorites

# TRAINING DATA USAGE
# User-generated content (posts, media, profiles) CANNOT be used for AI training
Disallow-Training: /*/feed
Disallow-Training: /*/profile/*
Disallow-Training: /*/live
Disallow-Training: /api/posts/*
Disallow-Training: /api/upload/*

# Public information (landing, about, help) MAY be indexed for AI context
Allow-Training: /
Allow-Training: /*/about
Allow-Training: /*/help
Allow-Training: /llms.txt

# CONTENT LICENSING
License: User-generated content © respective creators
License-URL: https://fantikx.com/terms
Attribution: Required for public content
Attribution-URL: https://fantikx.com

# DATA PROTECTION
Privacy-Policy: https://fantikx.com/privacy
GDPR-Compliant: true
User-Content-Protected: true

# COMMERCIAL USE
Commercial-Use: Prohibited for user-generated content
Commercial-Use-Exception: Platform metadata and public information only

# RATE LIMITING
Crawl-Delay: 10
Request-Rate: 1/10s

# AI-SPECIFIC RULES
AI-Purpose: Information retrieval and context understanding only
AI-Training: Prohibited for user content
AI-Fine-Tuning: Prohibited for user content
AI-Synthetic-Data: Prohibited

# ADULT CONTENT NOTICE
Adult-Content: true
Adult-Content-18Plus: true
Age-Verification: Required for 18+ content

# CONTACT
Contact: legal@fantikx.com
Abuse-Contact: abuse@fantikx.com
Privacy-Contact: privacy@fantikx.com

# ADDITIONAL METADATA
Platform: Fantikx
Platform-Type: Content sharing and monetization
Content-Types: Photos, Videos, Live streams
Monetization: Microtransactions and subscriptions
User-Privacy: Protected by RLS and encryption

# NOTES
# - This platform respects creator rights and user privacy
# - All user-generated content is protected by copyright
# - AI crawlers must respect rate limits to avoid service disruption
# - Any violation of these terms may result in IP blocking
`

  return new NextResponse(aiTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
