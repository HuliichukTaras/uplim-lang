import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
          <div className="text-center max-w-md">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
            <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/en">Go Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/en/discover">Discover Content</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
