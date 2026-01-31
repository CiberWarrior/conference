'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import LoadingSpinner from './LoadingSpinner'
import { showSuccess, showError } from '@/utils/toast'
import {
  getPriceBreakdownFromInput,
  formatPriceWithoutZeros,
  getPriceAmount,
  getCurrentPricingTier,
  getCurrencySymbol,
} from '@/utils/pricing'
import type { CustomRegistrationField, ParticipantSettings, ConferencePricing, HotelOption, PaymentSettings, StandardFeeTypeKey } from '@/types/conference'
import type { Participant } from '@/types/participant'
import { getTranslatedFieldLabelKey } from '@/lib/registration-field-labels'
import ParticipantManager from '@/components/admin/ParticipantManager'
import PaymentForm from '@/components/PaymentForm'
import { AlertCircle, Euro, UserPlus, Bed, Upload } from 'lucide-react'
import Link from 'next/link'

interface RegistrationFormProps {
  conferenceId?: string
  conferenceSlug?: string // Conference slug for navigation
  customFields?: CustomRegistrationField[] // Custom registration fields from conference settings
  participantSettings?: ParticipantSettings // Settings for multiple participants
  registrationInfoText?: string // Informational text to display at the top of the form
  pricing?: ConferencePricing // Pricing information for registration fee selection
  hotelOptions?: HotelOption[] // Available hotels for accommodation
  currency?: string // Currency symbol (EUR, USD, etc.)
  conferenceStartDate?: string // Conference start date (ISO string)
  conferenceEndDate?: string // Conference end date (ISO string)
  abstractSubmissionEnabled?: boolean // Whether abstract submission is enabled
  paymentSettings?: PaymentSettings // Payment options and preferences (admin-controlled)
  hasBankAccount?: boolean // Whether organizer has configured bank account
  conferenceName?: string
  conferenceDate?: string
  conferenceLocation?: string
}

export default function RegistrationForm({
  conferenceId,
  conferenceSlug,
  customFields = [],
  participantSettings,
  registrationInfoText,
  pricing,
  hotelOptions = [],
  currency = 'EUR',
  conferenceStartDate,
  conferenceEndDate,
  abstractSubmissionEnabled = false,
  paymentSettings,
  hasBankAccount = false,
  conferenceName,
  conferenceDate,
  conferenceLocation,
}: RegistrationFormProps) {
  const t = useTranslations('registrationForm')
  const tFieldLabels = useTranslations('admin.conferences')
  const locale = useLocale()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [selectedFee, setSelectedFee] = useState<string>('') // Selected registration fee type
  const [activeTab, setActiveTab] = useState<'registration' | 'accommodation'>('registration') // Tab state

  // Auto-select first enabled custom fee type when list loads and current selection is empty or invalid
  useEffect(() => {
    const list = pricing?.custom_fee_types?.filter((ft) => ft.enabled !== false) ?? []
    if (!list.length) return
    const valid = list.some((ft) => selectedFee === `fee_type_${ft.id}`)
    if (!selectedFee || !valid) setSelectedFee(`fee_type_${list[0].id}`)
  }, [pricing?.custom_fee_types, selectedFee])
  
  // ============================================
  // PDV/VAT display logic (public form)
  // We display ONLY the final price to the participant (sa PDV-om),
  // while admin dashboards can still show both net/gross breakdowns.
  // Pricing values stored in conference pricing can be either net or gross,
  // depending on the conference pricing setting: pricing.prices_include_vat.
  // ============================================
  const vatPercentage: number | undefined = (() => {
    const raw = pricing?.vat_percentage
    if (raw === null || raw === undefined) return undefined
    const parsed = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  })()

  const pricesIncludeVAT = !!pricing?.prices_include_vat

  const getDisplayPrice = (inputPrice: number) => {
    // Always show the final (VAT-inclusive) price to participants
    return getPriceBreakdownFromInput(inputPrice, vatPercentage, pricesIncludeVAT).withVAT
  }

  // Fee type display: standard types use i18n only (Early Bird → Rana prijava etc.). Custom fee types use admin-defined name (feeType.name).
  const FEE_TYPE_I18N_KEYS: Record<StandardFeeTypeKey, string> = {
    early_bird: 'feeTypeEarlyBird',
    regular: 'feeTypeRegular',
    late: 'feeTypeLate',
    student: 'feeTypeStudent',
    accompanying_person: 'feeTypeAccompanyingPerson',
  }
  const getFeeTypeDisplayName = (tier: StandardFeeTypeKey) => t(FEE_TYPE_I18N_KEYS[tier])

  // Paleta boja za kartice tipova kotizacija – pojačane nijanse (rub, pozadina, hover)
  const FEE_TYPE_CARD_COLORS = [
    { border: 'border-blue-600', borderDefault: 'border-blue-400', bg: 'bg-blue-100', bgDefault: 'bg-blue-50', hover: 'hover:border-blue-500', text: 'text-blue-900', textMuted: 'text-blue-800', divider: 'border-blue-300', price: 'text-blue-800', radio: 'text-blue-600 focus:ring-blue-500' },
    { border: 'border-indigo-600', borderDefault: 'border-indigo-400', bg: 'bg-indigo-100', bgDefault: 'bg-indigo-50', hover: 'hover:border-indigo-500', text: 'text-indigo-900', textMuted: 'text-indigo-800', divider: 'border-indigo-300', price: 'text-indigo-800', radio: 'text-indigo-600 focus:ring-indigo-500' },
    { border: 'border-emerald-600', borderDefault: 'border-emerald-400', bg: 'bg-emerald-100', bgDefault: 'bg-emerald-50', hover: 'hover:border-emerald-500', text: 'text-emerald-900', textMuted: 'text-emerald-800', divider: 'border-emerald-300', price: 'text-emerald-800', radio: 'text-emerald-600 focus:ring-emerald-500' },
    { border: 'border-amber-600', borderDefault: 'border-amber-400', bg: 'bg-amber-100', bgDefault: 'bg-amber-50', hover: 'hover:border-amber-500', text: 'text-amber-900', textMuted: 'text-amber-800', divider: 'border-amber-300', price: 'text-amber-800', radio: 'text-amber-600 focus:ring-amber-500' },
    { border: 'border-rose-600', borderDefault: 'border-rose-400', bg: 'bg-rose-100', bgDefault: 'bg-rose-50', hover: 'hover:border-rose-500', text: 'text-rose-900', textMuted: 'text-rose-800', divider: 'border-rose-300', price: 'text-rose-800', radio: 'text-rose-600 focus:ring-rose-500' },
  ] as const

  // Format validity text from admin-entered "od kada / do kada" (valid from / valid to)
  const formatValidityText = (fromDate?: string | null, toDate?: string | null): string => {
    if (!fromDate && !toDate) return ''
    const from = fromDate ? new Date(fromDate).toLocaleDateString(locale) : null
    const to = toDate ? new Date(toDate).toLocaleDateString(locale) : null
    if (from && to) return `${t('validFromShort')} ${from} ${t('validToShort')} ${to}`
    if (to) return `${t('validUntilShort')} ${to}`
    if (from) return `${t('validFromShort')} ${from}`
    return ''
  }

  // "Available from X to Y" – za prikaz kao na referentnim primjerima (EN/HR)
  const formatAvailabilityText = (fromDate?: string | null, toDate?: string | null): string => {
    if (!fromDate && !toDate) return ''
    const from = fromDate ? new Date(fromDate).toLocaleDateString(locale) : null
    const to = toDate ? new Date(toDate).toLocaleDateString(locale) : null
    if (from && to) return `${t('availableFrom')} ${from} ${t('availableTo')} ${to}`
    if (to) return `${t('validUntilShort')} ${to}`
    if (from) return `${t('availableFrom')} ${from}`
    return ''
  }

  // Determine which payment options are available based on settings
  const availablePaymentOptions = {
    card: paymentSettings?.allow_card ?? true,
    bank: (paymentSettings?.allow_bank_transfer ?? true) && hasBankAccount,
    // Pay Later removed from product
    later: false,
  }

  // Payment preference state - default based on payment settings (and constrained by available options)
  const defaultPaymentPreference: 'pay_now_card' | 'pay_now_bank' = (() => {
    const configured = paymentSettings?.default_preference ?? 'pay_now_card'

    const isAllowed =
      (configured === 'pay_now_card' && availablePaymentOptions.card) ||
      (configured === 'pay_now_bank' && availablePaymentOptions.bank)

    if (isAllowed) return configured

    // Fallback to first available option
    if (availablePaymentOptions.card) return 'pay_now_card'
    if (availablePaymentOptions.bank) return 'pay_now_bank'
    return 'pay_now_card'
  })()
  
  const [paymentPreference, setPaymentPreference] = useState<'pay_now_card' | 'pay_now_bank'>(
    defaultPaymentPreference
  )
  const [bankTransferProofFile, setBankTransferProofFile] = useState<File | null>(null)
  const [registrationId, setRegistrationId] = useState<string | null>(null) // For payment redirect
  // Option A: same-page card payment – after register success when payment_required
  const [showPaymentStep, setShowPaymentStep] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentCurrency, setPaymentCurrency] = useState<string>('EUR')
  
  // Count available options
  const availableOptionsCount = Object.values(availablePaymentOptions).filter(Boolean).length

  // Iznos odabrane kotizacije (za prikaz "Nije potrebno plaćanje" kad je 0)
  const selectedFeeAmount = ((): number => {
    if (!pricing || !selectedFee) return 0
    if (selectedFee === 'early_bird') return getPriceAmount(pricing.early_bird?.amount, pricing.currency)
    if (selectedFee === 'regular') return getPriceAmount(pricing.regular?.amount, pricing.currency)
    if (selectedFee === 'student') {
      const reg = getPriceAmount(pricing.regular?.amount, pricing.currency)
      const disc = getPriceAmount(pricing.student_discount, pricing.currency)
      return pricing.student?.regular ?? (reg - disc)
    }
    if (selectedFee === 'late') return getPriceAmount(pricing.late?.amount, pricing.currency)
    if (selectedFee === 'accompanying_person') return getPriceAmount(pricing.accompanying_person_price, pricing.currency)
    if (selectedFee.startsWith('fee_type_')) {
      const id = selectedFee.replace('fee_type_', '')
      const ft = pricing.custom_fee_types?.find((f) => f.id === id)
      if (!ft) return 0
      if (ft.amount != null && ft.amount !== undefined) return ft.amount
      const tier = getCurrentPricingTier(pricing, new Date(), conferenceStartDate ? new Date(conferenceStartDate) : undefined)
      return tier === 'early_bird' ? ft.early_bird : tier === 'regular' ? ft.regular : ft.late
    }
    if (selectedFee.startsWith('custom_')) {
      const fid = selectedFee.replace('custom_', '')
      const cf = pricing.custom_fields?.find((f) => f.id === fid)
      return cf ? getPriceAmount(cf.value, pricing.currency) : 0
    }
    return 0
  })()
  
  // Accommodation state
  const [arrivalDate, setArrivalDate] = useState<string>('')
  const [departureDate, setDepartureDate] = useState<string>('')
  const [numberOfNights, setNumberOfNights] = useState<number>(0)
  const [selectedHotel, setSelectedHotel] = useState<string>('') // Selected hotel ID

  // Payer type: Person vs Company (for invoicing / billing)
  const [payerType, setPayerType] = useState<'person' | 'company'>('person')
  const [companyNoVat, setCompanyNoVat] = useState(false)
  const [companyVatNumber, setCompanyVatNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyCountry, setCompanyCountry] = useState('')
  const [companyCity, setCompanyCity] = useState('')
  const [companyPostalCode, setCompanyPostalCode] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  
  // Multiple participants state
  const [participants, setParticipants] = useState<Participant[]>([
    {
      customFields: {},
    },
  ])

  // Calculate number of nights when dates change
  const calculateNights = (arrival: string, departure: string) => {
    if (arrival && departure) {
      const arrivalTime = new Date(arrival).getTime()
      const departureTime = new Date(departure).getTime()
      const nights = Math.round((departureTime - arrivalTime) / (1000 * 60 * 60 * 24))
      setNumberOfNights(nights > 0 ? nights : 0)
    } else {
      setNumberOfNights(0)
    }
  }

  // Filter hotels based on availability dates
  const getAvailableHotels = () => {
    if (!arrivalDate || !departureDate) return []

    const arrival = new Date(arrivalDate)
    const departure = new Date(departureDate)
    const conferenceStart = conferenceStartDate ? new Date(conferenceStartDate) : null
    const conferenceEnd = conferenceEndDate ? new Date(conferenceEndDate) : null

    return hotelOptions.filter((hotel) => {
      // Check if hotel has availability dates set
      const hotelAvailableFrom = hotel.available_from ? new Date(hotel.available_from) : conferenceStart
      const hotelAvailableUntil = hotel.available_until ? new Date(hotel.available_until) : conferenceEnd

      // If no dates are set and no conference dates, make hotel available
      if (!hotelAvailableFrom && !hotelAvailableUntil) return true

      // Check if selected dates fall within hotel availability
      const isAvailable = (!hotelAvailableFrom || arrival >= hotelAvailableFrom) &&
                          (!hotelAvailableUntil || departure <= hotelAvailableUntil)

      return isAvailable
    })
  }

  // Validate required fields before submission
  const validateForm = (): boolean => {
    // Check if there's at least one participant
    if (participants.length === 0) {
      showError(t('atLeastOneParticipant'))
      return false
    }

    // Check if registration fee is selected (if pricing is available)
    if (pricing && !selectedFee) {
      showError(t('pleaseSelectFee'))
      return false
    }

    // If paying as company, validate company fields (all required except phone and VAT when "I don't have VAT")
    if (pricing && paymentSettings?.enabled && payerType === 'company') {
      if (!companyName?.trim()) {
        showError(t('companyNameRequired'))
        return false
      }
      if (!companyCountry?.trim()) {
        showError(t('companyCountryRequired'))
        return false
      }
      if (!companyCity?.trim()) {
        showError(t('companyCityRequired'))
        return false
      }
      if (!companyPostalCode?.trim()) {
        showError(t('companyPostalCodeRequired'))
        return false
      }
      if (!companyAddress?.trim()) {
        showError(t('companyAddressRequired'))
        return false
      }
      if (!companyNoVat && !companyVatNumber?.trim()) {
        showError(t('companyVatRequired'))
        return false
      }
    }

    // Check all required custom fields for each participant
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i]
      
      for (const field of customFields) {
        if (field.required) {
          const value = participant.customFields?.[field.name]
          
          // Check if required field is empty
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            (field.type === 'checkbox' && value !== true)
          ) {
            const labelKey = getTranslatedFieldLabelKey(field.name, field.label)
            const displayLabel = labelKey ? tFieldLabels(labelKey) : field.label
            showError(t('participantFieldRequired', { num: i + 1, label: displayLabel }))
            return false
          }
        }
      }
    }

    return true
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        conference_id: conferenceId,
        custom_data: {}, // No global custom data anymore, everything is per-participant
        participants: participants,
        registration_fee_type: selectedFee || null, // Include selected fee type
        payment_preference: paymentPreference, // Payment preference: pay_now_card, pay_now_bank
        locale: locale === 'hr' ? 'hr' : 'en', // Za e-mail potvrde (HR/EN)
        accommodation: arrivalDate && departureDate ? {
          arrival_date: arrivalDate,
          departure_date: departureDate,
          number_of_nights: numberOfNights,
          hotel_id: selectedHotel || null, // Include selected hotel
        } : null,
        // Payer type and company details (for invoicing / billing)
        payer_type: payerType,
        company_details:
          payerType === 'company'
            ? {
                vat_number: companyNoVat ? null : companyVatNumber?.trim() || null,
                no_vat: companyNoVat,
                company_name: companyName?.trim() || '',
                country: companyCountry?.trim() || '',
                city: companyCity?.trim() || '',
                postal_code: companyPostalCode?.trim() || '',
                address: companyAddress?.trim() || '',
                phone: companyPhone?.trim() || null,
              }
            : null,
      }

      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2))

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ Error from API:', errorData)
        throw new Error(errorData.error || t('registrationFailed'))
      }

      const data = await response.json()

      // Option A: pay_now_card and amount > 0 → show payment step on same page
      if (data.payment_required && data.registrationId && data.amount != null) {
        setRegistrationId(data.registrationId)
        setPaymentAmount(Number(data.amount))
        setPaymentCurrency(data.currency || 'EUR')
        setShowPaymentStep(true)
        showSuccess(t('registrationSuccess'))
      } else {
        setSubmitSuccess(true)
        showSuccess(t('registrationSuccess'))
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error)
      showError(error.message || t('submitFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Option A: same-page card payment – show PaymentForm after successful registration
  if (showPaymentStep && registrationId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-medium text-green-800">{t('registrationSuccess')}</p>
          <p className="text-sm text-green-700 mt-1">{t('payNowCardSamePage')}</p>
        </div>
        <PaymentForm
          registrationId={registrationId}
          amount={paymentAmount}
          currency={paymentCurrency}
          conferenceName={conferenceName}
          conferenceDate={conferenceDate}
          conferenceLocation={conferenceLocation}
          onSuccess={() => {
            setShowPaymentStep(false)
            setSubmitSuccess(true)
            showSuccess(t('paymentSuccess'))
          }}
          onError={(err: string) => showError(err)}
        />
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-12 md:p-16 rounded-2xl shadow-xl border-2 border-green-200">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('successTitle')}</h2>
            <p className="text-lg text-gray-700 mb-6">{t('successMessage')}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-green-200">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">{t('successCheckEmail')}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="contents">
      {/* Registration Fee Selection - OUTSIDE FORM CONTAINER */}
      {pricing && customFields.length > 0 && activeTab === 'registration' && (pricing.custom_fee_types?.filter((ft) => ft.enabled !== false).length ?? 0) > 0 && (
        <div className="w-full -mx-8 px-8 mb-10" style={{ marginLeft: 'calc(-2rem - 1px)', marginRight: 'calc(-2rem - 1px)', width: 'calc(100% + 4rem + 2px)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <Euro className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{t('selectFee')}</h2>
                <p className="text-sm text-gray-600">{t('selectFeeCategory')}</p>
              </div>
            </div>

            {/* 3 vrste kotizacije u jednom redu (responsive: 1 na uskom, 3 na širem) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(pricing.custom_fee_types?.filter((ft) => ft.enabled !== false) ?? []).map((feeType, index) => {
                  const c = FEE_TYPE_CARD_COLORS[index % FEE_TYPE_CARD_COLORS.length]
                  const isSelected = selectedFee === `fee_type_${feeType.id}`
                  return (
              <label
                    key={feeType.id}
                    className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer h-full transition-all ${
                      isSelected ? `${c.border} ${c.bg} shadow-md` : `${c.borderDefault} ${c.bgDefault} ${c.hover}`
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                <input
                        type="radio"
                        name="registration_fee"
                        value={`fee_type_${feeType.id}`}
                        checked={isSelected}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className={`w-5 h-5 focus:ring-2 focus:ring-offset-2 mt-0.5 cursor-pointer flex-shrink-0 ${c.radio}`}
                />
                      <div className="flex-1 min-w-0">
                        <div className={`text-lg font-bold mb-1.5 leading-tight ${c.text}`}>
                          {feeType.name}
                        </div>
                        {feeType.description && (
                          <div className={`text-xs leading-relaxed mb-1 ${c.textMuted}`}>{feeType.description}</div>
                        )}
                        {(formatAvailabilityText(feeType.valid_from, feeType.valid_to) ||
                          (pricing.regular?.start_date
                            ? `${t('availableFrom')} ${new Date(pricing.regular.start_date).toLocaleDateString(locale)}${pricing.late?.start_date ? ` ${t('availableTo')} ${new Date(pricing.late.start_date).toLocaleDateString(locale)}` : ''}`
                            : pricing.early_bird?.deadline
                              ? `${t('after')} ${new Date(pricing.early_bird.deadline).toLocaleDateString(locale)}`
                              : '')) && (
                          <div className={`mt-1.5 text-sm font-medium leading-snug ${c.textMuted}`}>
                            {formatAvailabilityText(feeType.valid_from, feeType.valid_to) ||
                              (pricing.regular?.start_date
                                ? `${t('availableFrom')} ${new Date(pricing.regular.start_date).toLocaleDateString(locale)}${pricing.late?.start_date ? ` ${t('availableTo')} ${new Date(pricing.late.start_date).toLocaleDateString(locale)}` : ''}`
                                : pricing.early_bird?.deadline
                                  ? `${t('after')} ${new Date(pricing.early_bird.deadline).toLocaleDateString(locale)}`
                                  : '')}
                          </div>
                        )}
              </div>
            </div>
                    <div className={`mt-auto pt-4 border-t-2 ${c.divider}`}>
                      {/* Cijena u gridu: iznos s decimalama + simbol valute (kompaktno, bez pune širine) */}
                      <div className={`inline-grid grid-cols-[auto_auto] gap-x-1 items-baseline ${c.price}`}>
                        <span className="text-2xl font-bold tabular-nums">
                          {getDisplayPrice(
                            feeType.amount != null && feeType.amount !== undefined
                              ? feeType.amount
                              : (() => {
                                  const tier = getCurrentPricingTier(
                                    pricing,
                                    new Date(),
                                    conferenceStartDate ? new Date(conferenceStartDate) : undefined
                                  )
                                  return tier === 'early_bird' ? feeType.early_bird : tier === 'regular' ? feeType.regular : feeType.late
                                })()
                          ).toFixed(2)}
                        </span>
                        <span className="text-xl font-semibold">{getCurrencySymbol(pricing.currency)}</span>
                      </div>
          </div>
              </label>
                  )
                })}
          </div>

          {!selectedFee && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800">{t('pleaseSelectFee')}</p>
            </div>
          )}
            </div>
          </div>
      )}

      <form
        onSubmit={onSubmit}
        className="max-w-7xl mx-auto animate-fade-in space-y-8"
      >
      {/* Registration Information Text */}
      {registrationInfoText && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 rounded-lg shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-2">{t('registrationInfoTitle')}</h3>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {registrationInfoText}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-10">
        <nav className="flex flex-wrap gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('registration')}
              className={`flex items-center gap-3 px-6 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'registration'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <UserPlus className={`w-5 h-5 ${activeTab === 'registration' ? 'text-white' : 'text-gray-500'}`} />
              <span>{t('tabRegistration')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('accommodation')}
              className={`flex items-center gap-3 px-6 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'accommodation'
                  ? 'bg-green-600 text-white shadow-md shadow-green-500/20'
                  : 'text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <Bed className={`w-5 h-5 ${activeTab === 'accommodation' ? 'text-white' : 'text-gray-500'}`} />
              <span>{t('tabAccommodation')}</span>
            </button>
            
            {abstractSubmissionEnabled && conferenceSlug && (
              <Link
                href={`/conferences/${conferenceSlug}/submit-abstract`}
                className="flex items-center gap-3 px-6 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 border border-gray-200"
              >
                <Upload className="w-5 h-5 text-gray-500" />
                <span>{t('tabAbstractSubmission')}</span>
              </Link>
            )}
        </nav>
      </div>

      {/* Registration Tab Content */}
      {activeTab === 'registration' && (
        <div className="space-y-8">
          {/* Kartica: Podaci o sudionicima (polja obrasca) */}
          {customFields.length > 0 && (
            <div className="rounded-xl border-2 border-blue-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{t('formTitle')}</h2>
                  <p className="text-sm text-gray-600">{t('formSubtitle')}</p>
                </div>
              </div>
              <div className="animate-slide-in">
                <ParticipantManager
                  participants={participants}
                  onChange={setParticipants}
                  maxParticipants={participantSettings?.maxParticipants || 5}
                  participantFields={participantSettings?.participantFields || []}
                  customFields={customFields}
                  participantLabel={participantSettings?.participantLabel || t('participantLabel')}
                  customFieldsPerParticipant={true}
                />
              </div>
            </div>
          )}

          {/* Empty state when no fields */}
          {customFields.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">{t('noFieldsConfigured')}</p>
              <p className="text-sm text-gray-500">
                {t('contactAdministrator')}
              </p>
            </div>
          )}

          {/* Način plaćanja – otvara se kad sudionik odabere kotizaciju */}
          {pricing && selectedFee && paymentSettings?.enabled && availableOptionsCount > 0 && (
            <div className="pt-8 border-t-2 border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{t('paymentMethodTitle')}</h2>
                  <p className="text-sm text-gray-600">
                    {availableOptionsCount === 1 ? t('paymentMethodTitle') : t('choosePaymentSubtitle')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                  {/* Pay Now - Credit Card (conditional) */}
                  {availablePaymentOptions.card && (
                  <label
                    className={`flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentPreference === 'pay_now_card'
                        ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-100'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_preference"
                      value="pay_now_card"
                      checked={paymentPreference === 'pay_now_card'}
                      onChange={(e) => setPaymentPreference(e.target.value as any)}
                      className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="font-bold text-gray-900">{t('creditDebitCard')}</div>
                      </div>
                      <p className="text-sm text-gray-600 ml-11">{t('payWithStripe')}</p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                      {t('instant')}
                    </div>
                  </label>
                  )}

                  {/* Pay Now - Bank Transfer (conditional) */}
                  {availablePaymentOptions.bank && (
                  <label
                    className={`flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentPreference === 'pay_now_bank'
                        ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-100'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_preference"
                      value="pay_now_bank"
                      checked={paymentPreference === 'pay_now_bank'}
                      onChange={(e) => setPaymentPreference(e.target.value as any)}
                      className="mt-1 w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                        </div>
                        <div className="font-bold text-gray-900">{t('bankTransfer')}</div>
                      </div>
                      <p className="text-sm text-gray-600 ml-11">{t('bankTransferDescription')}</p>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                      {t('oneTwoDays')}
                    </div>
                  </label>
                  )}

                </div>

                {/* Payer type: Person vs Company (radio) */}
                <div className="mt-8 pt-6 border-t-2 border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-3">{t('payerTypeLabel')}</h3>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payer_type"
                        value="person"
                        checked={payerType === 'person'}
                        onChange={() => setPayerType('person')}
                        className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      />
                      <span className="font-medium text-gray-900">{t('payerPerson')}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payer_type"
                        value="company"
                        checked={payerType === 'company'}
                        onChange={() => setPayerType('company')}
                        className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      />
                      <span className="font-medium text-gray-900">{t('payerCompany')}</span>
                    </label>
                  </div>

                  {/* Company details form (when Company selected) */}
                  {payerType === 'company' && (
                    <div className="mt-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200 space-y-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-4">{t('companyDetailsTitle')}</h4>

                      {/* VAT number + "I don't have a VAT number" */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('companyVatNumber')}
                          {!companyNoVat && <span className="text-red-600 ml-1">*</span>}
                        </label>
                        <div className="flex flex-wrap items-center gap-4">
                          <input
                            type="text"
                            value={companyVatNumber}
                            onChange={(e) => setCompanyVatNumber(e.target.value)}
                            disabled={companyNoVat}
                            placeholder={companyNoVat ? '' : t('vatPlaceholder')}
                            className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={companyNoVat}
                              onChange={(e) => {
                                setCompanyNoVat(e.target.checked)
                                if (e.target.checked) setCompanyVatNumber('')
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{t('companyNoVat')}</span>
                          </label>
                        </div>
                      </div>

                      {/* Company name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('companyName')} <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={t('companyNamePlaceholder')}
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('companyCountry')} <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={companyCountry}
                          onChange={(e) => setCompanyCountry(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={t('companyCountryPlaceholder')}
                        />
                      </div>

                      {/* City + Postal code */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('companyCity')} <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={companyCity}
                            onChange={(e) => setCompanyCity(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('companyCityPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('companyPostalCode')} <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={companyPostalCode}
                            onChange={(e) => setCompanyPostalCode(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('companyPostalCodePlaceholder')}
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('companyAddress')} <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={t('companyAddressPlaceholder')}
                        />
                      </div>

                      {/* Phone (optional) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('companyPhone')} <span className="text-gray-500 text-xs">({t('optional')})</span>
                        </label>
                        <input
                          type="text"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={t('companyPhonePlaceholder')}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank Transfer Instructions (conditional) */}
                {paymentPreference === 'pay_now_bank' && availablePaymentOptions.bank && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-gray-900 mb-2">{t('bankTransferInstructions')}</h4>
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                          {t('bankTransferIntro')}
                        </p>
                        <div className="bg-white border border-green-200 rounded-lg p-5">
                          <p className="font-bold text-gray-900 mb-3">{t('whatHappensNext')}</p>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start gap-3">
                              <span className="text-green-600 font-bold mt-0.5">✓</span>
                              <span>{t('bankStep1')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-green-600 font-bold mt-0.5">✓</span>
                              <span>{t('bankStep2')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-green-600 font-bold mt-0.5">✓</span>
                              <span>{t('bankStep3')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-green-600 font-bold mt-0.5">✓</span>
                              <span>{t('bankStep4')}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Optional: File upload for proof of payment */}
                    <div className="mt-5 pt-5 border-t-2 border-green-200">
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        {t('uploadProofOptional')}
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setBankTransferProofFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer transition-colors"
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        {t('uploadProofHint')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
          )}

          {/* Submit Button */}
          {customFields.length > 0 && (
            <div className="flex justify-end mt-10 pt-8 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center gap-3 text-base"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>{t('submitting')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('submitRegistration')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Accommodation Tab Content */}
      {activeTab === 'accommodation' && (
        <div className="space-y-10">
            {/* Date Selection Card */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Bed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{t('accommodationDates')}</h2>
                  <p className="text-sm text-gray-600">{t('selectArrivalDeparture')}</p>
                </div>
              </div>

            <div className="max-w-md mx-auto space-y-4">
                          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('checkIn')}
                            </label>
                            <input
                              type="date"
                  value={arrivalDate}
                  onChange={(e) => {
                    setArrivalDate(e.target.value)
                    calculateNights(e.target.value, departureDate)
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('checkOut')}
                            </label>
                            <input
                              type="date"
                  value={departureDate}
                  onChange={(e) => {
                    setDepartureDate(e.target.value)
                    calculateNights(arrivalDate, e.target.value)
                  }}
                  min={arrivalDate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

              {/* Summary */}
              {arrivalDate && departureDate && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mt-8 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{t('checkIn')}:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {arrivalDate ? new Date(arrivalDate).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : t('notSelected')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{t('checkOut')}:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {departureDate ? new Date(departureDate).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : t('notSelected')}
                      </span>
                    </div>
                    <div className="border-t-2 border-green-300 mt-4 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-gray-900">{t('numberOfNightsLabel')}</span>
                        <span className="text-3xl font-bold text-green-600">{numberOfNights}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!arrivalDate && !departureDate && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
                  <p className="text-gray-600 font-medium">{t('noDatesSelected')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('selectArrivalDeparture')}</p>
                      </div>
                        )}
                      </div>
            </div>

            {/* Hotel Selection - Only show when dates are selected */}
            {arrivalDate && departureDate && numberOfNights > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center">
                    <Bed className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('selectHotel')}</h3>
                    <p className="text-sm text-gray-500">{t('chooseAccommodation')}</p>
                  </div>
                </div>

                {(() => {
                  const availableHotels = getAvailableHotels()
                  
                    if (availableHotels.length === 0) {
                    return (
                      <div className="text-center py-12 bg-amber-50 border-2 border-amber-200 rounded-xl">
                        <svg className="w-16 h-16 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                        <p className="text-base font-semibold text-amber-900 mb-2">{t('noHotelsForDates')}</p>
                        <p className="text-sm text-amber-700">
                          {t('tryDifferentDatesOrContact')}
              </p>
          </div>
                    )
                  }

                  return (
                    <div className="space-y-4">
                      {availableHotels
                        .sort((a, b) => a.order - b.order)
                        .map((hotel) => {
                      const totalPrice = hotel.pricePerNight * numberOfNights
                      return (
            <label
                          key={hotel.id}
                          className={`block p-6 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedHotel === hotel.id
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                        }`}
                      >
                          <div className="flex items-start gap-4">
                <input
                              type="radio"
                              name="hotel"
                              value={hotel.id}
                              checked={selectedHotel === hotel.id}
                              onChange={(e) => setSelectedHotel(e.target.value)}
                              className="mt-1 w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                    🏨 {hotel.name}
                                  </h4>
                                  {hotel.description && (
                                    <p className="text-sm text-gray-600 mb-3">{hotel.description}</p>
                                  )}
              </div>
                                <div className="text-right ml-4">
                                  <div className="text-2xl font-bold text-green-600">
                                    {formatPriceWithoutZeros(totalPrice)} {currency}
            </div>
                                  <p className="text-xs text-gray-500 mt-1">{t('total')}</p>
          </div>
              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                                  <span className="font-medium">{hotel.occupancy}</span>
                  </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                                  <span>
                                    {new Date(arrivalDate).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-US', { month: 'short', day: 'numeric' })} - {new Date(departureDate).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                                  <span className="font-medium">{numberOfNights} {numberOfNights === 1 ? t('night') : t('nights')}</span>
                  </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                                  <span>{formatPriceWithoutZeros(hotel.pricePerNight)} {currency}{t('perNight')}</span>
              </div>
                </div>
              </div>
            </div>
                        </label>
                      )
                    })}
          </div>
                  )
                })()}

                {!selectedHotel && getAvailableHotels().length > 0 && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-amber-800">{t('selectHotelToContinue')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button for Accommodation Tab */}
            {arrivalDate && departureDate && (
              <div className="flex justify-end mt-10 pt-8 border-t-2 border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting || (hotelOptions.length > 0 && !selectedHotel)}
                  className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center gap-3 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>{t('submitting')}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('completeRegistration')}</span>
                    </>
                  )}
                </button>
              </div>
            )}
        </div>
      )}
    </form>
    </div>
  )
}
