export const locales = ["en", "de", "uk", "es", "fr", "ja", "ko", "pt", "ru", "tr", "zh-CN", "zh-TW"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  uk: "Українська",
  es: "Español",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
  ru: "Русский",
  tr: "Türkçe",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
}

export const localeCodes: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  uk: "UA",
  es: "ES",
  fr: "FR",
  ja: "JP",
  ko: "KR",
  pt: "PT",
  ru: "RU",
  tr: "TR",
  "zh-CN": "CN",
  "zh-TW": "TW",
}
