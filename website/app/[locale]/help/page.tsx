import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default function HelpPage() {
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
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Get help with TellooS</p>
        </div>
      </section>

      {/* Help Topics */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/faq"
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">FAQ</h3>
              <p className="text-gray-600">Frequently asked questions</p>
            </Link>

            <Link
              href="/contact"
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Support</h3>
              <p className="text-gray-600">Get in touch with our team</p>
            </Link>

            <Link
              href="/legal/terms"
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Terms of Service</h3>
              <p className="text-gray-600">Read our terms and conditions</p>
            </Link>

            <Link
              href="/legal/privacy"
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy Policy</h3>
              <p className="text-gray-600">How we protect your data</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
