'use client'

import { useTranslations } from 'next-intl'
import type { RegistrationFeeOption } from '@/types/custom-registration-fee'
import { formatPriceWithoutZeros } from '@/utils/pricing'

interface FeeTypeSelectorProps {
  /** Fees from GET /api/conferences/[slug]/registration-fees (custom_registration_fees) */
  registrationFees: RegistrationFeeOption[]
  currency?: string
  selectedFee: string
  onSelectFee: (feeId: string) => void
  showWarning?: boolean
}

const CARD_COLORS: Record<string, string> = {
  default: 'from-blue-500 to-indigo-600',
  early: 'from-green-500 to-emerald-600',
  regular: 'from-blue-500 to-blue-600',
  late: 'from-amber-500 to-orange-600',
  student: 'from-purple-500 to-violet-600',
}

export default function FeeTypeSelector({
  registrationFees,
  currency = 'EUR',
  selectedFee,
  onSelectFee,
}: FeeTypeSelectorProps) {
  const t = useTranslations('registrationForm')
  const curr = currency || 'EUR'

  if (!registrationFees || registrationFees.length === 0) {
    return null
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('selectFeeType')}</h2>
        <p className="text-gray-600">{t('selectFeeCategory')}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {registrationFees.map((opt, idx) => {
          const isSelected = selectedFee === opt.id
          const isDisabled = !opt.is_available
          const colorKey = Object.keys(CARD_COLORS)[idx % Object.keys(CARD_COLORS).length]
          const gradient = CARD_COLORS[colorKey] || CARD_COLORS.default

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isDisabled}
              onClick={() => (isDisabled ? undefined : onSelectFee(opt.id))}
              className={`text-left p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                isDisabled
                  ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50'
                  : isSelected
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${gradient} shadow-md`}
                >
                  {opt.name}
                </div>
                {isSelected && !isDisabled && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">
                  {opt.price_gross === 0 ? (
                    <span className="text-green-600">{t('free')}</span>
                  ) : (
                    <>
                      {formatPriceWithoutZeros(opt.price_gross)}{' '}
                      <span className="text-lg font-semibold text-gray-600">
                        {opt.currency || curr}
                      </span>
                    </>
                  )}
                </p>
                {isDisabled && opt.disabled_reason && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-700">
                      {opt.disabled_reason === 'sold_out' && t('capacityReached')}
                      {opt.disabled_reason === 'not_available_yet' &&
                        (t('notAvailableYet') || 'Not available yet')}
                      {opt.disabled_reason === 'expired' && (t('expired') || 'Expired')}
                      {opt.disabled_reason === 'inactive' && (t('inactive') || 'Inactive')}
                    </p>
                  </div>
                )}
                {opt.capacity != null && opt.capacity > 0 && !isDisabled && (
                  <p className="text-xs text-gray-500 mt-2">
                    {(opt.sold_count ?? 0)} / {opt.capacity} {t('registered')}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
