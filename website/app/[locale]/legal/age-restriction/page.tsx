import { Link } from "@/i18n/navigation"
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function AgeRestriction() {
  return (
    <main className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="neuro-raised rounded-3xl p-8 md:p-12 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-8 w-8 text-[#ec4899]" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#ec4899] to-[#a855f7] bg-clip-text text-transparent">
              Age Restriction Notice (18+)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Last updated: January 1, 2025</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Age Requirement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Telloos is intended for users who are 18 years of age or older. By using this platform, you confirm that
                you meet this age requirement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Adult Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                Some content on Telloos may contain adult themes, including but not limited to mature imagery,
                discussions, and artistic expression intended for adult audiences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Age Verification</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users must verify their age to access certain content. We implement age gates and content warnings to
                protect minors from inappropriate material.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Parental Responsibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                Parents and guardians are responsible for monitoring their children's internet usage. We recommend using
                parental control software to restrict access to adult content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Enforcement</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to terminate accounts of users who misrepresent their age or attempt to circumvent
                age verification measures.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
