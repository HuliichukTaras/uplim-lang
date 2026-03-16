import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBadgeById, BADGE_TIER_COLORS } from "@/lib/badges"
import { generateSEOMetadata } from "@/lib/seo/metadata"

interface Props {
    params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, id } = await params
    const badge = getBadgeById(id)

    if (!badge) {
        return { title: "Badge Not Found | Fantikx" }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"

    return generateSEOMetadata({
        title: `${badge.name} Badge`,
        description: badge.description,
        url: `${baseUrl}/${locale}/badges/${id}`,
        type: "website",
        locale,
        keywords: [
            "Fantikx",
            "badge",
            badge.name,
            badge.category,
            "achievement",
            "creator badge",
        ],
    })
}

export default async function BadgePage({ params }: Props) {
    const { id } = await params
    const badge = getBadgeById(id)

    if (!badge) {
        notFound()
    }

    const tierColors = BADGE_TIER_COLORS[badge.tier]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"

    // JSON-LD structured data for the badge
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "@id": `${baseUrl}/en/badges/${id}#badge`,
        name: badge.name,
        description: badge.description,
        image: `${baseUrl}/en/badges/${id}/opengraph-image`,
        creator: {
            "@type": "Organization",
            name: "Fantikx",
            url: baseUrl,
        },
        genre: "Achievement Badge",
        keywords: [badge.category, badge.tier, "achievement"],
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    {/* Badge Card */}
                    <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-700 shadow-2xl">
                        {/* Badge Icon */}
                        <div
                            className="w-32 h-32 mx-auto rounded-full flex items-center justify-center text-6xl mb-6 shadow-lg"
                            style={{
                                background: tierColors.bg,
                                borderWidth: 4,
                                borderStyle: "solid",
                                borderColor: tierColors.border,
                            }}
                        >
                            {badge.icon}
                        </div>

                        {/* Badge Name */}
                        <h1 className="text-3xl font-bold text-white text-center mb-2">
                            {badge.name}
                        </h1>

                        {/* Tier */}
                        <div className="flex justify-center mb-4">
                            <span
                                className="px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wide"
                                style={{
                                    background: tierColors.bg,
                                    color: tierColors.text,
                                }}
                            >
                                {badge.tier}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-gray-300 text-center mb-6 leading-relaxed">
                            {badge.description}
                        </p>

                        {/* Criteria */}
                        <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                How to earn
                            </h2>
                            <ul className="space-y-2">
                                {badge.criteria.map((criterion, index) => (
                                    <li key={index} className="flex items-start gap-2 text-gray-300">
                                        <span className="text-pink-500 mt-1">✓</span>
                                        <span>{criterion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTA */}
                        <a
                            href="/"
                            className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-6 rounded-xl text-center transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Join Fantikx
                        </a>

                        {/* Footer */}
                        <p className="text-gray-500 text-center text-sm mt-6">
                            Earn badges by being active on Fantikx
                        </p>
                    </div>

                    {/* Branding */}
                    <div className="text-center mt-6">
                        <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                            Fantikx
                        </span>
                        <p className="text-gray-500 text-sm mt-1">
                            Best Creator Platform
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
