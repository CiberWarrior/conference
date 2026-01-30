'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import type { Locale } from '@/i18n/request'

const LOCALE_COOKIE = 'NEXT_LOCALE'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export default function LanguageSwitcher() {
  const router = useRouter()
  const locale = useLocale() as Locale

  const handleSwitch = (newLocale: Locale) => {
    if (newLocale === locale) return
    setLocaleCookie(newLocale)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 [.dark-sidebar_&]:border-gray-600 [.dark-sidebar_&]:bg-gray-800/80">
      <button
        type="button"
        onClick={() => handleSwitch('en')}
        className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
          locale === 'en'
            ? 'bg-white text-blue-600 shadow-sm [.dark-sidebar_&]:bg-gray-700 [.dark-sidebar_&]:text-yellow-400'
            : 'text-gray-600 hover:text-gray-900 [.dark-sidebar_&]:text-gray-300 [.dark-sidebar_&]:hover:text-white'
        }`}
        aria-label="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleSwitch('hr')}
        className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
          locale === 'hr'
            ? 'bg-white text-blue-600 shadow-sm [.dark-sidebar_&]:bg-gray-700 [.dark-sidebar_&]:text-yellow-400'
            : 'text-gray-600 hover:text-gray-900 [.dark-sidebar_&]:text-gray-300 [.dark-sidebar_&]:hover:text-white'
        }`}
        aria-label="Hrvatski"
      >
        HR
      </button>
    </div>
  )
}
