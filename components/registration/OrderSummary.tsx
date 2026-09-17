'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Receipt } from 'lucide-react'
import { formatPriceWithoutZeros } from '@/utils/pricing'
import type { HotelOption, RegistrationAddon } from '@/types/conference'
import type { RegistrationFeeOption } from '@/types/custom-registration-fee'
import type { Participant } from '@/types/participant'
import { getParticipantDisplayName } from '@/lib/registration-participant-validation'

interface OrderSummaryProps {
  currency: string
  registrationFees?: RegistrationFeeOption[] | null
  selectedFeeId: string
  selectedFeeAmount: number
  addons: RegistrationAddon[]
  selectedAddonIds: string[]
  addonsTotal: number
  chargeTotal: number
  participants: Participant[]
  participantLabel?: string
  hotelOptions?: HotelOption[]
  arrivalDate?: string
  departureDate?: string
  numberOfNights?: number
  selectedHotelId?: string
}

export default function OrderSummary({
  currency,
  registrationFees,
  selectedFeeId,
  selectedFeeAmount,
  addons,
  selectedAddonIds,
  addonsTotal,
  chargeTotal,
  participants,
  participantLabel,
  hotelOptions = [],
  arrivalDate,
  departureDate,
  numberOfNights = 0,
  selectedHotelId,
}: OrderSummaryProps) {
  const t = useTranslations('registrationForm')
  const locale = useLocale()
  const dateLocale = locale === 'hr' ? 'hr-HR' : 'en-US'
  const label = participantLabel || t('participantLabel')

  const feeName =
    registrationFees?.find((f) => f.id === selectedFeeId)?.name || t('standardRegistration')

  const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.id))
  const selectedHotel = hotelOptions.find((h) => h.id === selectedHotelId)
  const hotelEstimate =
    selectedHotel && numberOfNights > 0
      ? selectedHotel.pricePerNight * numberOfNights
      : 0

  const hasContent =
    selectedFeeId ||
    selectedAddons.length > 0 ||
    participants.length > 0 ||
    (arrivalDate && departureDate)

  if (!hasContent) return null

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('orderSummaryTitle')}</h2>
          <p className="text-sm text-gray-600">{t('orderSummarySubtitle')}</p>
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        {selectedFeeId && (
          <div className="flex justify-between gap-4 py-2 border-b border-gray-100">
            <dt className="text-gray-600">{t('orderSummaryFee')}</dt>
            <dd className="font-medium text-gray-900 text-right">
              {feeName}
              {' · '}
              {selectedFeeAmount === 0
                ? t('free')
                : `${formatPriceWithoutZeros(selectedFeeAmount)} ${currency}`}
            </dd>
          </div>
        )}

        {selectedAddons.map((addon) => (
          <div key={addon.id} className="flex justify-between gap-4 py-2 border-b border-gray-100">
            <dt className="text-gray-600">{addon.label}</dt>
            <dd className="font-medium text-gray-900">
              {formatPriceWithoutZeros(Number(addon.price || 0))} {addon.currency || currency}
            </dd>
          </div>
        ))}

        {participants.length > 0 && (
          <div className="py-2 border-b border-gray-100">
            <dt className="text-gray-600 mb-2">{t('orderSummaryParticipants')}</dt>
            <dd className="space-y-1">
              {participants.map((p, i) => (
                <div key={i} className="flex justify-between gap-4 text-gray-900">
                  <span>
                    {getParticipantDisplayName(p, `${label} ${i + 1}`)}
                    {p.isAccompanying && (
                      <span className="ml-1 text-xs text-violet-700">
                        ({t('accompanyingPersonBadge')})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </dd>
          </div>
        )}

        {arrivalDate && departureDate && (
          <div className="py-2 border-b border-gray-100 space-y-1">
            <dt className="text-gray-600">{t('orderSummaryAccommodation')}</dt>
            <dd className="text-gray-900">
              {new Date(arrivalDate).toLocaleDateString(dateLocale)} –{' '}
              {new Date(departureDate).toLocaleDateString(dateLocale)}
              {numberOfNights > 0 && (
                <span className="text-gray-600">
                  {' '}
                  · {t('numberOfNightsLabel')}: {numberOfNights}
                </span>
              )}
            </dd>
            {selectedHotel && (
              <dd className="text-gray-900 font-medium">{selectedHotel.name}</dd>
            )}
            {hotelEstimate > 0 && (
              <dd className="text-xs text-gray-500">{t('accommodationEstimateNote')}</dd>
            )}
          </div>
        )}
      </dl>

      <div className="mt-5 pt-4 border-t-2 border-gray-200 space-y-2">
        {chargeTotal > 0 && (
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">{t('orderSummaryTotalDue')}</span>
            <span className="text-xl font-bold text-blue-700">
              {formatPriceWithoutZeros(chargeTotal)} {currency}
            </span>
          </div>
        )}
        {hotelEstimate > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{t('orderSummaryHotelEstimate')}</span>
            <span className="font-medium text-gray-800">
              {formatPriceWithoutZeros(hotelEstimate)} {currency}
            </span>
          </div>
        )}
        {chargeTotal === 0 && hotelEstimate === 0 && (
          <p className="text-sm font-medium text-green-700">{t('noPaymentRequired')}</p>
        )}
      </div>
    </div>
  )
}
