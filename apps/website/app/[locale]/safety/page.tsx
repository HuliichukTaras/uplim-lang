import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">TellooS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                Login
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">Safety & Security</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Your safety is our top priority</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Content Protection</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              We use advanced technology to protect your content from unauthorized access, downloads, and screenshots.
              All content is encrypted and securely stored.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">Age Verification</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              All users must be 18+ to access adult content. We use industry-standard age verification to ensure
              compliance with legal requirements.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">Privacy & Data Security</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Your personal information is encrypted and never shared with third parties. We comply with GDPR and other
              privacy regulations.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">Reporting & Moderation</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              We have a dedicated team that reviews reported content and takes action against violations of our terms of
              service. Report any concerns to our support team.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link href="/contact">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Report a Safety Concern</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
