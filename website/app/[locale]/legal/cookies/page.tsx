export default function CookiesPolicy() {
  return (
    <main className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="neuro-raised rounded-3xl p-8 md:p-12 bg-white">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#38bdf8] to-[#67e8f9] bg-clip-text text-transparent">
            Cookies Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: January 1, 2025</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files stored on your device when you visit Telloos. They help us provide you with
                a better experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">2. How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies to remember your preferences, keep you logged in, analyze site traffic, and personalize
                content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Types of Cookies</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Essential cookies: Required for the site to function</li>
                <li>Analytics cookies: Help us understand how you use the site</li>
                <li>Preference cookies: Remember your settings and choices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control cookies through your browser settings. Note that disabling cookies may affect site
                functionality.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
