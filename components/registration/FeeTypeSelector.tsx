'use client'

import { useTranslations } from 'next-intl'
import { getCurrentPricingTier, getEffectiveFeeTypeAmount, getFeeTypePricingMode } from '@/utils/pricing'
import type { ConferencePricing, CustomFeeType } from '@/types/conference'
import { formatPriceWithoutZeros } from '@/utils/pricing'

interface FeeTypeSelectorProps {
  pricing: ConferencePricing
  selectedFee: string
  onSelectFee: (feeId: string) => void
  getDisplayPrice: (inputPrice: number) => number
  feeTypeUsage?: Record<string, number>
  conferenceStartDate?: string
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
  pricing,
  selectedFee,
  onSelectFee,
  getDisplayPrice,
  feeTypeUsage = {},
  conferenceStartDate,
}: FeeTypeSelectorProps) {
  const t = useTranslations('registrationForm')
  const list = pricing.custom_fee_types?.filter((ft) => ft.enabled !== false) ?? []
  const tier = getCurrentPricingTier(
    pricing,
    new Date(),
    conferenceStartDate ? new Date(conferenceStartDate) : undefined
  )

  return (
    <div className="space-y-6 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('selectFeeType')}</h2>
        <p className="text-gray-600">{t('selectFeeCategory')}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((ft: CustomFeeType, idx: number) => {
          const feeId = `fee_type_${ft.id}`
          const isSelected = selectedFee === feeId
          const usage = feeTypeUsage[feeId] ?? 0
          const atCapacity = typeof ft.capacity === 'number' && ft.capacity > 0 && usage >= ft.capacity
          const amount = getFeeTypePricingMode(ft) === 'free' ? 0 : getEffectiveFeeTypeAmount(ft, tier)
          const displayPrice = getDisplayPrice(amount)
          const colorKey = Object.keys(CARD_COLORS)[idx % Object.keys(CARD_COLORS).length]
          const gradient = CARD_COLORS[colorKey] || CARD_COLORS.default

          return (
            <button
              key={ft.id}
              type="button"
              onClick={() => onSelectFee(feeId)}
              className={`text-left p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                isSelected
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${gradient} shadow-md`}>
                  {ft.name}
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">
                  {displayPrice === 0 ? (
                    <span className="text-green-600">{t('free')}</span>
                  ) : (
                    <>
                      {formatPriceWithoutZeros(displayPrice)}{' '}
                      <span className="text-lg font-semibold text-gray-600">{pricing.currency}</span>
                    </>
                  )}
                </p>
                {ft.description && (
                  <p className="text-sm text-gray-600 mt-2">{ft.description}</p>
                )}
                {atCapacity && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-700">{t('capacityReached')}</p>
                  </div>
                )}
                {ft.capacity && !atCapacity && (
                  <p className="text-xs text-gray-500 mt-2">
                    {usage} / {ft.capacity} {t('registered')}
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
