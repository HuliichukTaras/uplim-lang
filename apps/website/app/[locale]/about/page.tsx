import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">About TellooS</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Empowering creators to monetize their content</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              TellooS was created to give content creators a fair and transparent platform to monetize their work. We
              believe creators should have full control over their content and pricing, while earning the majority of
              revenue from their work.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why TellooS?</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Traditional platforms take too much from creators and don't provide enough control. TellooS is different.
              We offer the lowest fees in the industry, complete content control, and instant payouts. Our smart blur
              system makes it easy to monetize exclusive content while protecting your work.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Values</h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-gray-600">
                  <strong>Creator First:</strong> Everything we build is designed to help creators succeed
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-gray-600">
                  <strong>Transparency:</strong> No hidden fees, clear pricing, honest communication
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-gray-600">
                  <strong>Security:</strong> Your content and data are protected with industry-leading security
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-gray-600">
                  <strong>Innovation:</strong> We're constantly improving and adding new features
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-12 text-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg rounded-full">
                Join TellooS Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
