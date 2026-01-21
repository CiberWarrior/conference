'use client'

import { formatPriceWithoutZeros } from '@/utils/pricing'
import { Calendar, MapPin, User, Users, Bed, Euro, CheckCircle, Mail } from 'lucide-react'
import type { ConferencePricing } from '@/types/conference'

interface RegistrationSummaryProps {
  conferenceName: string
  conferenceLocation?: string
  conferenceStartDate?: string
  conferenceEndDate?: string
  selectedFeeLabel: string
  selectedFeeAmount: number
  currency: string
  participantsCount: number
  accommodation?: {
    hotelName?: string
    nights?: number
    arrivalDate?: string
    departureDate?: string
  }
  userEmail?: string
  vatPercentage?: number
  pricesIncludeVAT?: boolean
}

export default function RegistrationSummary({
  conferenceName,
  conferenceLocation,
  conferenceStartDate,
  conferenceEndDate,
  selectedFeeLabel,
  selectedFeeAmount,
  currency,
  participantsCount,
  accommodation,
  userEmail,
  vatPercentage,
  pricesIncludeVAT,
}: RegistrationSummaryProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Registration Summary</h3>
          <p className="text-sm text-gray-600">Review your details before submitting</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Conference Info */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{conferenceName}</h4>
              {conferenceLocation && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  {conferenceLocation}
                </div>
              )}
              {(conferenceStartDate || conferenceEndDate) && (
                <p className="text-sm text-gray-600">
                  {formatDate(conferenceStartDate)}
                  {conferenceEndDate && ` - ${formatDate(conferenceEndDate)}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Registration Fee */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Euro className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">{selectedFeeLabel}</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {formatPriceWithoutZeros(selectedFeeAmount)} {currency}
            </span>
          </div>
          {vatPercentage && vatPercentage > 0 && (
            <p className="text-xs text-gray-600">
              {pricesIncludeVAT ? 'Price includes' : 'VAT'} ({vatPercentage}% PDV)
            </p>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Participants</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{participantsCount}</span>
          </div>
        </div>

        {/* Accommodation (if selected) */}
        {accommodation && accommodation.hotelName && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <Bed className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">Accommodation</p>
                <p className="text-sm text-gray-700 mb-1">{accommodation.hotelName}</p>
                {accommodation.nights && (
                  <p className="text-sm text-gray-600">
                    {accommodation.nights} night{accommodation.nights > 1 ? 's' : ''}
                  </p>
                )}
                {accommodation.arrivalDate && accommodation.departureDate && (
                  <p className="text-xs text-gray-500">
                    {formatDate(accommodation.arrivalDate)} → {formatDate(accommodation.departureDate)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Email (if provided) */}
        {userEmail && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Confirmation will be sent to:</p>
                <p className="font-semibold text-gray-900 text-sm">{userEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Total Amount</span>
            <span className="text-2xl font-bold">
              {formatPriceWithoutZeros(selectedFeeAmount)} {currency}
            </span>
          </div>
          {vatPercentage && vatPercentage > 0 && (
            <p className="text-xs text-white/80 mt-1">
              Final price (VAT included)
            </p>
          )}
        </div>
      </div>

      {/* Security Badge */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
        <svg
          className="w-4 h-4 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Secure registration • Your data is protected
      </div>
    </div>
  )
}
