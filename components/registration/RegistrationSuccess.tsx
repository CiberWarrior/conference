'use client'

import { useTranslations } from 'next-intl'

export default function RegistrationSuccess() {
  const t = useTranslations('registrationForm')

  return (
    <div className="max-w-md mx-auto mt-8 p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-xl animate-fade-in">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-3">{t('registrationSuccess')}</h2>
        <p className="text-green-700 text-lg">
          {t('registrationSuccess')}
        </p>
      </div>
    </div>
  )
}
