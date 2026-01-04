"use client"

import { Link } from "@/i18n/navigation"
import { Search } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-100 text-gray-500 py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-sm font-medium">
          {/* Copyright */}
          <div className="order-2 md:order-1">
            <span>© 2025 Fantikx</span>
          </div>

          {/* Navigation Links */}
          <nav className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <Link href="/discover" className="flex items-center gap-2 hover:text-black transition-colors">
              <Search className="w-4 h-4" />
              <span>Explore Fantikx</span>
            </Link>

            <Link href="/auth?tab=signup" className="hover:text-black transition-colors">
              Become A Creator
            </Link>

            <Link href="/support" className="hover:text-black transition-colors">
              Contact Support
            </Link>

            <Link href="/legal/complaint" className="hover:text-black transition-colors">
              Complaint Process
            </Link>

            <Link href="/legal/terms" className="hover:text-black transition-colors">
              Terms
            </Link>

            <Link href="/legal/privacy" className="hover:text-black transition-colors">
              Privacy
            </Link>

            <LanguageSwitcher />
          </nav>
        </div>
      </div>
    </footer>
  )
}
