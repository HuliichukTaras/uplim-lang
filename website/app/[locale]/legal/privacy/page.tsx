export default function PrivacyPolicy() {
  return (
    <main className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="neuro-raised rounded-3xl p-8 md:p-12 bg-white">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: January 1, 2025</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us, including name, email address, profile information,
                and content you post on Telloos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, to communicate with
                you, and to personalize your experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share information with service providers who assist in
                our operations, and when required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your personal information from unauthorized
                access, alteration, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, correct, or delete your personal information. Contact us to exercise these
                rights.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
