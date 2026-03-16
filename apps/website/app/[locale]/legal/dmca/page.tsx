export default function DMCAPolicy() {
  return (
    <main className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="neuro-raised rounded-3xl p-8 md:p-12 bg-white">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] bg-clip-text text-transparent">
            DMCA POLICY — FANTIKX
          </h1>

          <div className="prose prose-slate max-w-none space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Fantikx complies fully with the Digital Millennium Copyright Act (DMCA).
            </p>

            <p className="text-muted-foreground leading-relaxed">
              If you believe your copyrighted content has been uploaded without permission, you may submit a takedown
              request to:
            </p>

            <p className="text-foreground leading-relaxed font-semibold text-lg">copyright@fantikx.com</p>

            <div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Your DMCA notice must include:</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Your full name</li>
                <li>Your email address</li>
                <li>A link to the copyrighted material</li>
                <li>A link to the infringing material on Fantikx</li>
                <li>A statement that you are the copyright owner</li>
                <li>A statement under penalty of perjury that the information is accurate</li>
              </ul>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Upon receiving a valid DMCA notice, Fantikx will remove or disable access to the content. Repeat copyright
              violators may have their accounts terminated.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              Fantikx acts only as a hosting provider and is not responsible for user-uploaded content.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
