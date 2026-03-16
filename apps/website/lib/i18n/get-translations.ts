import { defaultLocale } from "./config"
import { getLocale } from "./get-locale"

type Messages = {
  [key: string]: string | Messages
}

export async function getTranslations(namespace?: string): Promise<(key: string) => string> {
  const locale = await getLocale()

  let messages: Messages
  try {
    messages = await import(`@/messages/${locale}.json`)
  } catch {
    messages = await import(`@/messages/${defaultLocale}.json`)
  }

  return (key: string) => {
    const keys = namespace ? `${namespace}.${key}`.split(".") : key.split(".")
    let value: any = messages

    for (const k of keys) {
      value = value?.[k]
    }

    return typeof value === "string" ? value : key
  }
}
