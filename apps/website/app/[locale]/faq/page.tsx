import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default function FAQPage() {
  const faqs = [
    {
      question: "How does TellooS work?",
      answer:
        "TellooS allows creators to upload exclusive content that is automatically blurred. Fans can unlock content for a price you set. You earn money every time someone unlocks your content.",
    },
    {
      question: "How much does it cost to join?",
      answer:
        "It's completely free to join TellooS. We only take a small percentage when you make money. No upfront costs or monthly fees for the basic plan.",
    },
    {
      question: "How do I get paid?",
      answer:
        "You can withdraw your earnings anytime to your bank account or card. Payments are processed securely through Stripe and typically arrive within 2-3 business days.",
    },
    {
      question: "What content can I upload?",
      answer:
        "You can upload photos and videos. All content must comply with our terms of service. 18+ content is allowed but must be properly marked and follows all legal requirements.",
    },
    {
      question: "How is my content protected?",
      answer:
        "Your content is protected with blur technology and watermarking. We also have systems in place to prevent unauthorized downloads and screenshots.",
    },
    {
      question: "Can I set my own prices?",
      answer:
        "Yes! You have full control over pricing. Set different prices for different content and change them anytime.",
    },
  ]

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
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Everything you need to know about TellooS</p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h3>
            <p className="text-gray-600 mb-6">Contact our support team for help</p>
            <Link href="/contact">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Contact Support</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
