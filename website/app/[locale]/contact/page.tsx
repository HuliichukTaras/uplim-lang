import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">We'd love to hear from you</p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Name
              </label>
              <Input id="name" type="text" placeholder="Your name" className="w-full" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <Input id="email" type="email" placeholder="your@email.com" className="w-full" />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                Subject
              </label>
              <Input id="subject" type="text" placeholder="How can we help?" className="w-full" />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                Message
              </label>
              <Textarea id="message" placeholder="Tell us more..." rows={6} className="w-full" />
            </div>

            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              Send Message
            </Button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-2">Or email us directly at:</p>
            <a href="mailto:support@fantikx.com" className="text-blue-600 hover:text-blue-700 font-semibold">
              support@fantikx.com
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
