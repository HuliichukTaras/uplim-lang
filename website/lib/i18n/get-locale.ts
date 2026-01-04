import { type Locale, defaultLocale } from "./config"
import { cookies } from "next/headers"

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get("locale")?.value as Locale
  return locale || defaultLocale
}

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies()
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60, // 1 year
  })
}
