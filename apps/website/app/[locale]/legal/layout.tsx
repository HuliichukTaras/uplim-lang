import { Link } from "@/i18n/navigation"
import { ArrowLeft } from 'lucide-react'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple public header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-semibold hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
              Telloos
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8 px-4">
        {children}
      </main>
    </div>
  )
}
