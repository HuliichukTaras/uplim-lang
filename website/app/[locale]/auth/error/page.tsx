import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-[#fafbfc] via-[#f5f7fa] to-[#f0f2f5]">
      <div className="w-full max-w-sm">
        <Card className="neuro-raised">
          <CardHeader>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{params?.error || "An error occurred during authentication."}</p>
            <Link href="/" className="text-sm text-[#00d4ff] hover:underline">
              Back to home
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
