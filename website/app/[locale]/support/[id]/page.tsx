import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { generateSEOMetadata } from "@/lib/seo/metadata"
import { notFound } from "next/navigation"
import Link from "next/link"

interface Props {
    params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, id } = await params
    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"

    // Get creator info (NO private data, NO amounts)
    const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, handle, avatar_url")
        .eq("id", id)
        .single()

    if (!profile) {
        return { title: "Support | Fantikx" }
    }

    const creatorName = profile.display_name || profile.handle || "Creator"

    return generateSEOMetadata({
        title: `Support ${creatorName} on Fantikx`,
        description: `Show your appreciation for ${creatorName}'s content on Fantikx. Join the community of supporters!`,
        url: `${baseUrl}/${locale}/support/${id}`,
        image: profile.avatar_url,
        type: "website",
        locale,
        keywords: [
            "Fantikx",
            "support creator",
            creatorName,
            "tip creator",
            "creator support",
        ],
    })
}

export default async function SupportPage({ params }: Props) {
    const { locale, id } = await params
    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"

    // Get creator info (NO private data, NO transaction amounts)
    const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, handle, avatar_url, bio, is_creator")
        .eq("id", id)
        .single()

    if (!profile) {
        notFound()
    }

    const creatorName = profile.display_name || profile.handle || "Creator"

    // JSON-LD for support action
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "DonateAction",
        "@id": `${baseUrl}/${locale}/support/${id}#action`,
        name: `Support ${creatorName}`,
        description: `Show appreciation for ${creatorName}'s content on Fantikx`,
        recipient: {
            "@type": "Person",
            name: creatorName,
            url: `${baseUrl}/${locale}/profile/${profile.handle}`,
        },
        provider: {
            "@type": "Organization",
            name: "Fantikx",
            url: baseUrl,
        },
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    {/* Support Card */}
                    <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-700 shadow-2xl text-center">
                        {/* Heart Icon */}
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
                            <span className="text-4xl">❤️</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Support Received! 💖
                        </h1>

                        {/* Subtitle */}
                        <p className="text-gray-400 mb-6">
                            Your support means the world to creators
                        </p>

                        {/* Creator Info */}
                        <div className="bg-gray-900/50 rounded-2xl p-6 mb-6">
                            <div className="flex flex-col items-center gap-4">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={creatorName}
                                        className="w-24 h-24 rounded-full border-4 border-pink-500 shadow-xl"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-3xl font-bold">
                                        {creatorName[0]?.toUpperCase()}
                                    </div>
                                )}

                                <div>
                                    <div className="text-xl text-white font-bold">{creatorName}</div>
                                    <div className="text-gray-400">@{profile.handle}</div>
                                    {profile.is_creator && (
                                        <span className="inline-block mt-2 px-3 py-1 bg-pink-500/20 text-pink-400 text-sm rounded-full">
                                            ✓ Creator
                                        </span>
                                    )}
                                </div>
                            </div>

                            {profile.bio && (
                                <p className="text-gray-400 text-sm mt-4 line-clamp-3">
                                    {profile.bio}
                                </p>
                            )}
                        </div>

                        {/* Message */}
                        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl p-4 mb-6 border border-pink-500/20">
                            <p className="text-gray-300 text-sm">
                                ✨ You're helping {creatorName} continue creating amazing content!
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="space-y-3">
                            <Link
                                href={`/${locale}/profile/${profile.handle}`}
                                className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                            >
                                View {creatorName}'s Profile
                            </Link>

                            <Link
                                href={`/${locale}/discover`}
                                className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                            >
                                Discover More Creators
                            </Link>
                        </div>
                    </div>

                    {/* Branding */}
                    <div className="text-center mt-6">
                        <Link href="/">
                            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                                Fantikx
                            </span>
                        </Link>
                        <p className="text-gray-500 text-sm mt-1">
                            Best Creator Platform
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
