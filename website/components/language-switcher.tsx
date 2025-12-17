"use client"

import { Globe } from "lucide-react"
import { useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { locales, localeNames, localeCodes, type Locale } from "@/i18n/config"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const currentLocale = (pathname.split("/")[1] || "en") as Locale

  const changeLocale = (newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`

    const segments = pathname.split("/")
    segments[1] = newLocale
    const newPath = segments.join("/")

    startTransition(() => {
      router.push(newPath)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
          disabled={isPending}
        >
          <Globe className="w-4 h-4" />
          <span className={isCollapsed ? "" : "hidden sm:inline"}>
            {isCollapsed ? localeCodes[currentLocale] : localeNames[currentLocale]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLocale(locale)}
            className={currentLocale === locale ? "bg-gray-100" : ""}
          >
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
