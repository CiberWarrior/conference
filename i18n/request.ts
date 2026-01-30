import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

/** Supported locales: only EN (English) and HR (Croatian) */
export const locales = ['en', 'hr'] as const
export type Locale = (typeof locales)[number]

const defaultLocale: Locale = 'en'

export default getRequestConfig(async () => {
  const headersList = await headers()
  const forcedLocale = headersList.get('x-next-intl-locale')
  if (forcedLocale === 'en') {
    const messages = (await import(`../messages/en.json`)).default
    return { locale: 'en', messages, timeZone: 'Europe/Zagreb' }
  }

  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale =
    localeCookie === 'hr' || localeCookie === 'en' ? localeCookie : defaultLocale

  const messages = (await import(`../messages/${locale}.json`)).default

  return {
    locale,
    messages,
    timeZone: 'Europe/Zagreb',
  }
})
