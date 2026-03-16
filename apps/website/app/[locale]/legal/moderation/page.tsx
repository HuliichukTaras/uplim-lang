import { Link } from "@/i18n/navigation"
import { ArrowLeft, Shield } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function ContentModeration() {
  return (
    <main className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">

        <div className="neuro-raised rounded-3xl p-8 md:p-12 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-[#00d4ff]" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#38bdf8] bg-clip-text text-transparent">
              Content Moderation Guidelines
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Last updated: January 1, 2025</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Our Commitment</h2>
              <p className="text-muted-foreground leading-relaxed">
                Telloos is committed to maintaining a safe, respectful, and inclusive community for all users. We employ
                both automated systems and human moderators to enforce our guidelines.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Prohibited Content</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Illegal content or activities</li>
                <li>Harassment, bullying, or hate speech</li>
                <li>Non-consensual intimate imagery</li>
                <li>Content involving minors</li>
                <li>Spam or misleading information</li>
                <li>Violence or graphic content without appropriate warnings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Reporting System</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users can report content that violates our guidelines. All reports are reviewed by our moderation team
                within 24 hours.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Enforcement Actions</h2>
              <p className="text-muted-foreground leading-relaxed">
                Violations may result in content removal, temporary suspension, or permanent account termination,
                depending on severity and frequency.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Appeals Process</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users may appeal moderation decisions through our support system. Appeals are reviewed by senior
                moderators within 48 hours.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
