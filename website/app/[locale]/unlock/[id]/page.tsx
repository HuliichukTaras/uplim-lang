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

    // Get minimal post info (no private data)
    const { data: post } = await supabase
        .from("posts")
        .select(`
      id,
      caption,
      thumbnail_blurred_url,
      profiles!posts_user_id_fkey (
        display_name,
        handle
      )
    `)
        .eq("id", id)
        .single()

    if (!post) {
        return { title: "Content | Fantikx" }
    }

    const profile = post.profiles as any
    const creatorName = profile?.display_name || profile?.handle || "Creator"

    return generateSEOMetadata({
        title: `Content unlocked from ${creatorName}`,
        description: `Exclusive content now available on Fantikx. Join to discover more from ${creatorName}!`,
        url: `${baseUrl}/${locale}/unlock/${id}`,
        image: post.thumbnail_blurred_url,
        type: "website",
        locale,
        keywords: [
            "Fantikx",
            "unlocked content",
            "exclusive content",
            creatorName,
            "creator content",
        ],
    })
}

export default async function UnlockPage({ params }: Props) {
    const { locale, id } = await params
    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"

    // Get minimal post info (NO private data, NO prices)
    const { data: post } = await supabase
        .from("posts")
        .select(`
      id,
      caption,
      thumbnail_blurred_url,
      media_type,
      profiles!posts_user_id_fkey (
        display_name,
        handle,
        avatar_url
      )
    `)
        .eq("id", id)
        .single()

    if (!post) {
        notFound()
    }

    const profile = post.profiles as any
    const creatorName = profile?.display_name || profile?.handle || "Creator"

    // JSON-LD for the unlock action
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ViewAction",
        "@id": `${baseUrl}/${locale}/unlock/${id}#action`,
        name: `Content unlocked from ${creatorName}`,
        object: {
            "@type": "CreativeWork",
            name: post.caption?.slice(0, 100) || "Exclusive content",
            creator: {
                "@type": "Person",
                name: creatorName,
                url: `${baseUrl}/${locale}/profile/${profile?.handle}`,
            },
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
                    {/* Success Card */}
                    <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-700 shadow-2xl text-center">
                        {/* Success Icon */}
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Content Unlocked! 🎉
                        </h1>

                        {/* Subtitle */}
                        <p className="text-gray-400 mb-6">
                            You've unlocked exclusive content on Fantikx
                        </p>

                        {/* Content Preview (blurred) */}
                        {post.thumbnail_blurred_url && (
                            <div className="relative mb-6 rounded-xl overflow-hidden">
                                <img
                                    src={post.thumbnail_blurred_url}
                                    alt="Content preview"
                                    className="w-full h-48 object-cover blur-sm"
                                />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-lg font-semibold">
                                        {post.media_type === "video" ? "📹 Video" : "📷 Photo"}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Creator Info */}
                        <div className="flex items-center justify-center gap-3 mb-6">
                            {profile?.avatar_url && (
                                <img
                                    src={profile.avatar_url}
                                    alt={creatorName}
                                    className="w-12 h-12 rounded-full border-2 border-pink-500"
                                />
                            )}
                            <div className="text-left">
                                <div className="text-white font-semibold">{creatorName}</div>
                                <div className="text-gray-400 text-sm">@{profile?.handle}</div>
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="space-y-3">
                            <Link
                                href={`/${locale}/post/${id}`}
                                className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                            >
                                View Content
                            </Link>

                            <Link
                                href={`/${locale}/profile/${profile?.handle}`}
                                className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                            >
                                See More from {creatorName}
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
