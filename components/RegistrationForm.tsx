'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { showSuccess, showError } from '@/utils/toast'
import { getPriceAmount, formatPriceWithoutZeros } from '@/utils/pricing'
import type { CustomRegistrationField, ParticipantSettings, ConferencePricing, HotelOption, PaymentSettings } from '@/types/conference'
import type { Participant } from '@/types/participant'
import ParticipantManager from '@/components/admin/ParticipantManager'
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
}: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [selectedFee, setSelectedFee] = useState<string>('') // Selected registration fee type
  const [activeTab, setActiveTab] = useState<'registration' | 'accommodation'>('registration') // Tab state
  
  // Determine which payment options are available based on settings
  const availablePaymentOptions = {
    card: paymentSettings?.allow_card ?? true,
    bank: (paymentSettings?.allow_bank_transfer ?? true) && hasBankAccount,
    later: paymentSettings?.allow_pay_later ?? true,
  }

  // Payment preference state - default based on payment settings (and constrained by available options)
  const defaultPaymentPreference: 'pay_now_card' | 'pay_now_bank' | 'pay_later' = (() => {
    const configured = paymentSettings?.default_preference ?? 'pay_later'

    const isAllowed =
      (configured === 'pay_now_card' && availablePaymentOptions.card) ||
      (configured === 'pay_now_bank' && availablePaymentOptions.bank) ||
      (configured === 'pay_later' && availablePaymentOptions.later)

    if (isAllowed) return configured

    // Fallback to first available option
    if (availablePaymentOptions.card) return 'pay_now_card'
    if (availablePaymentOptions.bank) return 'pay_now_bank'
    return 'pay_later'
  })()
  
  const [paymentPreference, setPaymentPreference] = useState<'pay_now_card' | 'pay_now_bank' | 'pay_later'>(
    defaultPaymentPreference
  )
  const [bankTransferProofFile, setBankTransferProofFile] = useState<File | null>(null)
  const [registrationId, setRegistrationId] = useState<string | null>(null) // For payment redirect
  
  // Count available options
  const availableOptionsCount = Object.values(availablePaymentOptions).filter(Boolean).length
  
  // Accommodation state
  const [arrivalDate, setArrivalDate] = useState<string>('')
  const [departureDate, setDepartureDate] = useState<string>('')
  const [numberOfNights, setNumberOfNights] = useState<number>(0)
  const [selectedHotel, setSelectedHotel] = useState<string>('') // Selected hotel ID
  
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
      showError('At least one participant is required')
      return false
    }

    // Check if registration fee is selected (if pricing is available)
    if (pricing && !selectedFee) {
      showError('Please select a registration fee option')
      return false
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
            showError(`Participant ${i + 1}: ${field.label} is required`)
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
        payment_preference: paymentPreference, // Payment preference: pay_now_card, pay_now_bank, pay_later
        accommodation: arrivalDate && departureDate ? {
          arrival_date: arrivalDate,
          departure_date: departureDate,
          number_of_nights: numberOfNights,
          hotel_id: selectedHotel || null, // Include selected hotel
        } : null,
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
        throw new Error(errorData.error || 'Registration failed')
      }

      await response.json()

      setSubmitSuccess(true)
      showSuccess('Registration submitted successfully!')
    } catch (error: any) {
      console.error('❌ Registration error:', error)
      showError(error.message || 'Failed to submit registration')
    } finally {
      setIsSubmitting(false)
    }
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Registration Successful!</h2>
            <p className="text-lg text-gray-700 mb-6">Thank you for registering. You will receive a confirmation email shortly.</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-green-200">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Check your email for confirmation</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Registration Fee Selection - OUTSIDE FORM CONTAINER */}
      {pricing && customFields.length > 0 && activeTab === 'registration' && (
        <div className="w-full -mx-8 px-8 mb-10" style={{ marginLeft: 'calc(-2rem - 1px)', marginRight: 'calc(-2rem - 1px)', width: 'calc(100% + 4rem + 2px)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <Euro className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Select Registration Fee</h2>
                <p className="text-sm text-gray-600">Choose your registration category</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Early Bird - 1st */}
                {pricing.early_bird?.amount && (
              <label
                    className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer h-full transition-all ${
                      selectedFee === 'early_bird'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-blue-200 bg-blue-50/30 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                <input
                        type="radio"
                        name="registration_fee"
                        value="early_bird"
                        checked={selectedFee === 'early_bird'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-0.5 cursor-pointer flex-shrink-0"
                      />
                    <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold mb-1.5 leading-tight ${selectedFee === 'early_bird' ? 'text-blue-900' : 'text-blue-800'}`}>Early Bird</div>
                        <div className="text-xs text-blue-600 leading-relaxed">
                          {pricing.early_bird.deadline && `Until ${new Date(pricing.early_bird.deadline).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                    <div className="mt-auto pt-4 border-t-2 border-blue-200">
                      <div className="text-2xl font-bold text-blue-700 mb-1">
                        {formatPriceWithoutZeros(getPriceAmount(pricing.early_bird.amount, pricing.currency))}
                      </div>
                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{pricing.currency}</div>
            </div>
              </label>
                )}

                {/* Regular - 2nd */}
                {pricing.regular?.amount && (
              <label
                    className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer h-full transition-all ${
                      selectedFee === 'regular'
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-indigo-200 bg-indigo-50/30 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                <input
                        type="radio"
                        name="registration_fee"
                        value="regular"
                        checked={selectedFee === 'regular'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mt-0.5 cursor-pointer flex-shrink-0"
                />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold mb-1.5 leading-tight ${selectedFee === 'regular' ? 'text-indigo-900' : 'text-indigo-800'}`}>Regular</div>
                        <div className="text-xs text-indigo-600 leading-relaxed">Standard registration</div>
              </div>
            </div>
                    <div className="mt-auto pt-4 border-t-2 border-indigo-200">
                      <div className="text-2xl font-bold text-indigo-700 mb-1">
                        {formatPriceWithoutZeros(getPriceAmount(pricing.regular.amount, pricing.currency))}
                      </div>
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{pricing.currency}</div>
          </div>
              </label>
                )}

                {/* Student - 3rd */}
                {getPriceAmount(pricing.student_discount, pricing.currency) > 0 && pricing.regular?.amount && (
              <label
                    className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer h-full transition-all ${
                      selectedFee === 'student'
                        ? 'border-emerald-600 bg-emerald-50 shadow-md'
                        : 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                <input
                        type="radio"
                        name="registration_fee"
                        value="student"
                        checked={selectedFee === 'student'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 mt-0.5 cursor-pointer flex-shrink-0"
                />
                          <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold mb-1.5 leading-tight ${selectedFee === 'student' ? 'text-emerald-900' : 'text-emerald-800'}`}>Student</div>
                        <div className="text-xs text-emerald-600 leading-relaxed">Special discount for students</div>
              </div>
            </div>
                    <div className="mt-auto pt-4 border-t-2 border-emerald-200">
                      <div className="text-2xl font-bold text-emerald-700 mb-1">
                        {formatPriceWithoutZeros(
                          getPriceAmount(pricing.regular.amount, pricing.currency) -
                          getPriceAmount(pricing.student_discount, pricing.currency)
                        )}
                      </div>
                      <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">{pricing.currency}</div>
          </div>
              </label>
                )}

                {/* Late Registration - 4th */}
                {pricing.late?.amount && (
              <label
                    className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer h-full transition-all ${
                      selectedFee === 'late'
                        ? 'border-amber-600 bg-amber-50 shadow-md'
                        : 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                <input
                        type="radio"
                        name="registration_fee"
                        value="late"
                        checked={selectedFee === 'late'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 mt-0.5 cursor-pointer flex-shrink-0"
                />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold mb-1.5 leading-tight ${selectedFee === 'late' ? 'text-amber-900' : 'text-amber-800'}`}>Late Registration</div>
                        <div className="text-xs text-amber-600 leading-relaxed">After deadline</div>
              </div>
            </div>
                    <div className="mt-auto pt-4 border-t-2 border-amber-200">
                      <div className="text-2xl font-bold text-amber-700 mb-1">
                        {formatPriceWithoutZeros(getPriceAmount(pricing.late.amount, pricing.currency))}
                      </div>
                      <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">{pricing.currency}</div>
          </div>
              </label>
                )}

                {/* Accompanying Person - 5th */}
                {getPriceAmount(pricing.accompanying_person_price, pricing.currency) > 0 && (
              <label
                    className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer h-full transition-all ${
                      selectedFee === 'accompanying_person'
                        ? 'border-rose-600 bg-rose-50 shadow-md'
                        : 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-3">
                <input
                        type="radio"
                        name="registration_fee"
                        value="accompanying_person"
                        checked={selectedFee === 'accompanying_person'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-4 h-4 text-rose-600 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 mt-0.5 cursor-pointer flex-shrink-0"
                />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold mb-1 leading-tight ${selectedFee === 'accompanying_person' ? 'text-rose-900' : 'text-rose-800'}`}>Accompanying Person</div>
                        <div className="text-xs text-rose-600 leading-snug">For guests and companions</div>
              </div>
            </div>
                    <div className="mt-auto pt-4 border-t-2 border-rose-200">
                      <div className="text-2xl font-bold text-rose-700 mb-1">
                        {formatPriceWithoutZeros(getPriceAmount(pricing.accompanying_person_price, pricing.currency))}
                      </div>
                      <div className="text-xs font-semibold text-rose-600 uppercase tracking-wide">{pricing.currency}</div>
          </div>
              </label>
                )}

                {/* Custom Pricing Fields (e.g., Exhibitor, VIP, etc.) */}
                {pricing.custom_fields && pricing.custom_fields.map((customField) => (
              <label
                    key={customField.id}
                    className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer h-full transition-all ${
                      selectedFee === `custom_${customField.id}`
                        ? 'border-violet-600 bg-violet-50 shadow-md'
                        : 'border-violet-200 bg-violet-50/30 hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                <input
                        type="radio"
                        name="registration_fee"
                        value={`custom_${customField.id}`}
                        checked={selectedFee === `custom_${customField.id}`}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 mt-0.5 cursor-pointer flex-shrink-0"
                />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold mb-1.5 leading-tight ${selectedFee === `custom_${customField.id}` ? 'text-violet-900' : 'text-violet-800'}`}>{customField.name}</div>
                        {customField.description && (
                          <div className="text-xs text-violet-600 leading-relaxed">{customField.description}</div>
              )}
            </div>
          </div>
                    <div className="mt-auto pt-4 border-t-2 border-violet-200">
                      <div className="text-2xl font-bold text-violet-700 mb-1">
                        {formatPriceWithoutZeros(customField.value)}
                      </div>
                      <div className="text-xs font-semibold text-violet-600 uppercase tracking-wide">{pricing.currency}</div>
                    </div>
            </label>
                ))}
          </div>

          {!selectedFee && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800">Please select a registration fee option to continue</p>
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
              <h3 className="text-base font-bold text-gray-900 mb-2">Registration Information</h3>
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
              <span>Registration</span>
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
              <span>Accommodation</span>
            </button>
            
            {abstractSubmissionEnabled && conferenceSlug && (
              <Link
                href={`/conferences/${conferenceSlug}/submit-abstract`}
                className="flex items-center gap-3 px-6 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 border border-gray-200"
              >
                <Upload className="w-5 h-5 text-gray-500" />
                <span>Abstract Submission</span>
              </Link>
            )}
        </nav>
      </div>

      {/* Registration Tab Content */}
      {activeTab === 'registration' && (
        <div className="space-y-10">
          {/* Registration Form Section - Main Focus, No Nesting */}
          {customFields.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Registration Form</h2>
                  <p className="text-sm text-gray-600">Fill in your details below</p>
                </div>
              </div>
              
              <div className="animate-slide-in">
                <ParticipantManager
                  participants={participants}
                  onChange={setParticipants}
                  maxParticipants={participantSettings?.maxParticipants || 5}
                  participantFields={participantSettings?.participantFields || []}
                  customFields={customFields}
                  participantLabel={participantSettings?.participantLabel || 'Participant'}
                  customFieldsPerParticipant={true}
                />
              </div>
            </div>
          )}

          {/* Empty state when no fields */}
          {customFields.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">No registration fields configured yet.</p>
              <p className="text-sm text-gray-500">
                Please contact the conference administrator.
              </p>
            </div>
          )}

          {/* Payment Preference Section */}
          {pricing && selectedFee && paymentSettings?.enabled && availableOptionsCount > 0 && (
            <div className="pt-8 border-t-2 border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Options</h2>
                  <p className="text-sm text-gray-600">
                    {availableOptionsCount === 1 
                      ? 'Payment method' 
                      : 'Choose when and how you want to pay'}
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
                        <div className="font-bold text-gray-900">Credit/Debit Card</div>
                      </div>
                      <p className="text-sm text-gray-600 ml-11">Pay securely with Stripe (Instant confirmation)</p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                      Instant
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
                        <div className="font-bold text-gray-900">Bank Transfer</div>
                      </div>
                      <p className="text-sm text-gray-600 ml-11">Transfer to our bank account (Manual verification required)</p>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                      1-2 days
                    </div>
                  </label>
                  )}

                  {/* Pay Later (conditional) */}
                  {availablePaymentOptions.later && (
                  <label
                    className={`flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentPreference === 'pay_later'
                        ? 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-100'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_preference"
                      value="pay_later"
                      checked={paymentPreference === 'pay_later'}
                      onChange={(e) => setPaymentPreference(e.target.value as any)}
                      className="mt-1 w-5 h-5 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="font-bold text-gray-900">Pay Later</div>
                      </div>
                      <p className="text-sm text-gray-600 ml-11">Register now, receive payment instructions via email</p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                      Flexible
                    </div>
                  </label>
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
                        <h4 className="text-base font-bold text-gray-900 mb-2">Bank Transfer Instructions</h4>
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                          After submitting your registration, you will receive bank account details and a unique payment reference number via email.
                          Please complete the transfer within <strong className="text-gray-900">7 days</strong> to secure your spot.
                        </p>
                        <div className="bg-white border border-green-200 rounded-lg p-5">
                          <p className="font-bold text-gray-900 mb-3">What happens next:</p>
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start gap-3">
                              <span className="text-green-600 font-bold mt-0.5">✓</span>
                              <span>You'll receive an email with bank details and payment reference</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-green-600 font-bold mt-0.5">✓</span>
                              <span>Transfer the amount and optionally upload proof of payment</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-green-600 font-bold mt-0.5">✓</span>
                              <span>We'll verify your payment within 1-2 business days</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-green-600 font-bold mt-0.5">✓</span>
                              <span>You'll receive a confirmation email once verified</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Optional: File upload for proof of payment */}
                    <div className="mt-5 pt-5 border-t-2 border-green-200">
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        Upload Proof of Payment (Optional)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setBankTransferProofFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer transition-colors"
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        You can upload this now or later via the confirmation email link
                      </p>
                    </div>
                  </div>
                )}

                {/* Pay Later Info (conditional) */}
                {paymentPreference === 'pay_later' && availablePaymentOptions.later && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-gray-900 mb-2">Payment Instructions via Email</h4>
                        <p className="text-sm text-gray-700 leading-relaxed mb-4">
                          You will receive an email with payment instructions and a payment link. 
                          Please complete your payment before the conference to ensure your registration is confirmed.
                        </p>
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                          <p className="text-sm font-semibold text-amber-900">
                            <span className="inline-block mr-2">⚠️</span>
                            <strong>Reminder:</strong> Payment reminders will be sent automatically after 3, 7, and 14 days if payment is not received.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          )}

          {/* Submit Button - only visible in Registration tab */}
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
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Submit Registration</span>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Accommodation Dates</h2>
                  <p className="text-sm text-gray-600">Please select your arrival and departure dates</p>
                </div>
              </div>

            <div className="max-w-md mx-auto space-y-4">
                          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in (Arrival Date)
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
                  Check-out (Departure Date)
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
                      <span className="text-sm font-medium text-gray-700">Check-in:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {arrivalDate ? new Date(arrivalDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Not selected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Check-out:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {departureDate ? new Date(departureDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Not selected'}
                      </span>
                    </div>
                    <div className="border-t-2 border-green-300 mt-4 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-gray-900">Number of nights:</span>
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
                  <p className="text-gray-600 font-medium">No dates selected</p>
                  <p className="text-sm text-gray-500 mt-1">Please select your arrival and departure dates</p>
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
                    <h3 className="text-lg font-semibold text-gray-900">Select Your Hotel</h3>
                    <p className="text-sm text-gray-500">Choose from available accommodation options</p>
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
                        <p className="text-base font-semibold text-amber-900 mb-2">No hotels available for selected dates</p>
                        <p className="text-sm text-amber-700">
                          Please try different dates or contact the conference organizers for accommodation options.
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
                                  <p className="text-xs text-gray-500 mt-1">Total</p>
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
                                    {new Date(arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                                  <span className="font-medium">{numberOfNights} {numberOfNights === 1 ? 'night' : 'nights'}</span>
                  </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                                  <span>{formatPriceWithoutZeros(hotel.pricePerNight)} {currency}/night</span>
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
                    <p className="text-sm font-medium text-amber-800">Please select a hotel to continue</p>
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
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              </div>
            )}
        </div>
      )}
    </form>
    </>
  )
}
