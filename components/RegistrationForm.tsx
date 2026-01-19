'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { showSuccess, showError } from '@/utils/toast'
import { getPriceAmount } from '@/utils/pricing'
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
    console.log('🔍 Starting validation...')
    
    // Check if there's at least one participant
    if (participants.length === 0) {
      console.log('❌ Validation failed: No participants')
      showError('At least one participant is required')
      return false
    }

    // Check if registration fee is selected (if pricing is available)
    if (pricing && !selectedFee) {
      console.log('❌ Validation failed: No registration fee selected')
      console.log('Pricing exists:', !!pricing, 'Selected fee:', selectedFee)
      showError('Please select a registration fee option')
      return false
    }

    // Check all required custom fields for each participant
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i]
      console.log(`🔍 Validating Participant ${i + 1}:`, participant.customFields)
      
      for (const field of customFields) {
        if (field.required) {
          const value = participant.customFields?.[field.name]
          console.log(`  Checking field "${field.name}" (${field.label}): value =`, value, 'required =', field.required)
          
          // Check if required field is empty
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            (field.type === 'checkbox' && value !== true)
          ) {
            console.log(`❌ Validation failed: Participant ${i + 1}, field "${field.label}" is empty`)
            showError(`Participant ${i + 1}: ${field.label} is required`)
            return false
        }
        }
      }
    }

    console.log('✅ Validation passed!')
    return true
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('🔍 Form submission started')
    console.log('📊 Participants:', participants)
    console.log('💶 Selected Fee:', selectedFee)
    console.log('📝 Custom Fields:', customFields)

    if (!validateForm()) {
      console.log('❌ Validation failed')
      return
    }

    console.log('✅ Validation passed')

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

      const successData = await response.json()
      console.log('✅ Registration successful:', successData)

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 md:p-10 rounded-xl shadow-xl border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600">Thank you for registering. You will receive a confirmation email shortly.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-4xl mx-auto animate-fade-in"
    >
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
        {/* Registration Information Text */}
        {registrationInfoText && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Registration Information</h3>
                <div className="text-sm text-blue-800 whitespace-pre-line">
                  {registrationInfoText}
                  </div>
              </div>
                    </div>
                  </div>
                )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex gap-3 bg-gray-100 p-2 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('registration')}
              className={`flex items-center gap-2 px-6 py-4 text-base font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'registration'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md'
              }`}
            >
              <UserPlus className={`w-5 h-5 ${activeTab === 'registration' ? 'text-white' : 'text-gray-500'}`} />
              <span>Registration</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('accommodation')}
              className={`flex items-center gap-2 px-6 py-4 text-base font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'accommodation'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30 transform scale-105'
                  : 'text-green-700 bg-green-50 hover:bg-green-100 hover:shadow-md border-2 border-green-200'
              }`}
            >
              <Bed className={`w-5 h-5 ${activeTab === 'accommodation' ? 'text-white' : 'text-green-600'}`} />
              <span>Accommodation</span>
            </button>
            
            {abstractSubmissionEnabled && conferenceSlug && (
              <Link
                href={`/conferences/${conferenceSlug}/submit-abstract`}
                className="flex items-center gap-2 px-6 py-4 text-base font-semibold rounded-lg transition-all duration-200 text-purple-700 bg-purple-50 hover:bg-purple-100 hover:shadow-md border-2 border-purple-200"
              >
                <Upload className="w-5 h-5 text-purple-600" />
                <span>Abstract Submission</span>
              </Link>
            )}
          </nav>
                    </div>

        {/* Registration Tab Content */}
        {activeTab === 'registration' && (
          <div className="space-y-6">
          {/* Multiple Participants Section - ALWAYS shown, participants get ALL custom fields */}
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

          {/* Empty state when no fields */}
          {customFields.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No registration fields configured yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Please contact the conference administrator.
              </p>
                      </div>
                    )}

          {/* Registration Fee Selection */}
          {pricing && customFields.length > 0 && (
            <div className="mt-8 border-t-2 border-gray-100 pt-8">
            <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 border-2 border-purple-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
                  <Euro className="w-6 h-6 text-white" />
                  </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Select Registration Fee</h3>
                  <p className="text-sm text-gray-600">Choose your registration category</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Early Bird */}
                {pricing.early_bird?.amount && (
              <label
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedFee === 'early_bird'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                <input
                        type="radio"
                        name="registration_fee"
                        value="early_bird"
                        checked={selectedFee === 'early_bird'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                    <div>
                        <div className="font-semibold text-gray-900">Early Bird</div>
                        <div className="text-xs text-gray-500">
                          {pricing.early_bird.deadline && `Until ${new Date(pricing.early_bird.deadline).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                    <div className="text-xl font-bold text-blue-600">
                      {getPriceAmount(pricing.early_bird.amount, pricing.currency).toFixed(2)} {pricing.currency}
            </div>
              </label>
                )}

                {/* Regular */}
                {pricing.regular?.amount && (
              <label
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedFee === 'regular'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                <input
                        type="radio"
                        name="registration_fee"
                        value="regular"
                        checked={selectedFee === 'regular'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                      <div>
                        <div className="font-semibold text-gray-900">Regular</div>
                        <div className="text-xs text-gray-500">Standard registration</div>
              </div>
            </div>
                    <div className="text-xl font-bold text-purple-600">
                      {getPriceAmount(pricing.regular.amount, pricing.currency).toFixed(2)} {pricing.currency}
          </div>
              </label>
                )}

                {/* Late */}
                {pricing.late?.amount && (
              <label
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedFee === 'late'
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                <input
                        type="radio"
                        name="registration_fee"
                        value="late"
                        checked={selectedFee === 'late'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-orange-600 focus:ring-2 focus:ring-orange-500"
                />
                      <div>
                        <div className="font-semibold text-gray-900">Late Registration</div>
                        <div className="text-xs text-gray-500">After deadline</div>
              </div>
            </div>
                    <div className="text-xl font-bold text-orange-600">
                      {getPriceAmount(pricing.late.amount, pricing.currency).toFixed(2)} {pricing.currency}
          </div>
              </label>
                )}

                {/* Student */}
                {getPriceAmount(pricing.student_discount, pricing.currency) > 0 && pricing.regular?.amount && (
              <label
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedFee === 'student'
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                <input
                        type="radio"
                        name="registration_fee"
                        value="student"
                        checked={selectedFee === 'student'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                          <div>
                        <div className="font-semibold text-gray-900">Student</div>
                        <div className="text-xs text-gray-500">Special discount for students</div>
              </div>
            </div>
                    <div className="text-xl font-bold text-green-600">
                      {(
                        getPriceAmount(pricing.regular.amount, pricing.currency) -
                        getPriceAmount(pricing.student_discount, pricing.currency)
                      ).toFixed(2)}{' '}
                      {pricing.currency}
          </div>
              </label>
                )}

                {/* Accompanying Person */}
                {getPriceAmount(pricing.accompanying_person_price, pricing.currency) > 0 && (
              <label
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedFee === 'accompanying_person'
                        ? 'border-pink-500 bg-pink-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                <input
                        type="radio"
                        name="registration_fee"
                        value="accompanying_person"
                        checked={selectedFee === 'accompanying_person'}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-pink-600 focus:ring-2 focus:ring-pink-500"
                />
                      <div>
                        <div className="font-semibold text-gray-900">Accompanying Person</div>
                        <div className="text-xs text-gray-500">For guests and companions</div>
              </div>
            </div>
                    <div className="text-xl font-bold text-pink-600">
                      {getPriceAmount(pricing.accompanying_person_price, pricing.currency).toFixed(2)} {pricing.currency}
          </div>
              </label>
                )}

                {/* Custom Pricing Fields (e.g., Exhibitor, VIP, etc.) */}
                {pricing.custom_fields && pricing.custom_fields.map((customField) => (
              <label
                    key={customField.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedFee === `custom_${customField.id}`
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                <input
                        type="radio"
                        name="registration_fee"
                        value={`custom_${customField.id}`}
                        checked={selectedFee === `custom_${customField.id}`}
                        onChange={(e) => setSelectedFee(e.target.value)}
                        className="w-5 h-5 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
                      <div>
                        <div className="font-semibold text-gray-900">{customField.name}</div>
                        {customField.description && (
                          <div className="text-xs text-gray-500">{customField.description}</div>
              )}
            </div>
          </div>
                    <div className="text-xl font-bold text-indigo-600">
                      {customField.value.toFixed(2)} {pricing.currency}
                    </div>
            </label>
                ))}
                      </div>

              {!selectedFee && (
                <p className="text-sm text-red-600 mt-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Please select a registration fee option to continue
                </p>
                        )}
                      </div>
                    </div>
          )}

          {/* Payment Preference Section */}
          {pricing && selectedFee && paymentSettings?.enabled && availableOptionsCount > 0 && (
            <div className="mt-8 border-t-2 border-gray-100 pt-8">
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Payment Options</h3>
                    <p className="text-sm text-gray-600">
                      {availableOptionsCount === 1 
                        ? 'Payment method' 
                        : 'Choose when and how you want to pay'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Pay Now - Credit Card (conditional) */}
                  {availablePaymentOptions.card && (
                  <label
                    className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentPreference === 'pay_now_card'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_preference"
                      value="pay_now_card"
                      checked={paymentPreference === 'pay_now_card'}
                      onChange={(e) => setPaymentPreference(e.target.value as any)}
                      className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <div className="font-semibold text-gray-900">Credit/Debit Card</div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Pay securely with Stripe (Instant confirmation)</p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Instant
                    </div>
                  </label>
                  )}

                  {/* Pay Now - Bank Transfer (conditional) */}
                  {availablePaymentOptions.bank && (
                  <label
                    className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentPreference === 'pay_now_bank'
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_preference"
                      value="pay_now_bank"
                      checked={paymentPreference === 'pay_now_bank'}
                      onChange={(e) => setPaymentPreference(e.target.value as any)}
                      className="mt-1 w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                        <div className="font-semibold text-gray-900">Bank Transfer</div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Transfer to our bank account (Manual verification required)</p>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                      1-2 days
                    </div>
                  </label>
                  )}

                  {/* Pay Later (conditional) */}
                  {availablePaymentOptions.later && (
                  <label
                    className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentPreference === 'pay_later'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_preference"
                      value="pay_later"
                      checked={paymentPreference === 'pay_later'}
                      onChange={(e) => setPaymentPreference(e.target.value as any)}
                      className="mt-1 w-5 h-5 text-purple-600 focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="font-semibold text-gray-900">Pay Later</div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Register now, receive payment instructions via email</p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Flexible
                    </div>
                  </label>
                  )}
                </div>

                {/* Bank Transfer Instructions (conditional) */}
                {paymentPreference === 'pay_now_bank' && availablePaymentOptions.bank && (
                  <div className="mt-6 p-5 bg-white border-2 border-green-200 rounded-lg">
                    <div className="flex items-start gap-3 mb-4">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2">🏦 Bank Transfer Instructions</h4>
                        <p className="text-sm text-gray-700 mb-4">
                          After submitting your registration, you will receive bank account details and a unique payment reference number via email.
                          Please complete the transfer within <strong>7 days</strong> to secure your spot.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                          <p className="font-semibold text-blue-900 mb-2">What happens next:</p>
                          <ul className="space-y-1 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">✓</span>
                              <span>You'll receive an email with bank details and payment reference</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">✓</span>
                              <span>Transfer the amount and optionally upload proof of payment</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">✓</span>
                              <span>We'll verify your payment within 1-2 business days</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">✓</span>
                              <span>You'll receive a confirmation email once verified</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Optional: File upload for proof of payment */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Upload Proof of Payment (Optional)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setBankTransferProofFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You can upload this now or later via the confirmation email link
                      </p>
                    </div>
                  </div>
                )}

                {/* Pay Later Info (conditional) */}
                {paymentPreference === 'pay_later' && availablePaymentOptions.later && (
                  <div className="mt-6 p-5 bg-white border-2 border-purple-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">📧 Payment Instructions via Email</h4>
                        <p className="text-sm text-gray-700">
                          You will receive an email with payment instructions and a payment link. 
                          Please complete your payment before the conference to ensure your registration is confirmed.
                        </p>
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
                          <strong>Reminder:</strong> Payment reminders will be sent automatically after 3, 7, and 14 days if payment is not received.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button - only visible in Registration tab */}
          {customFields.length > 0 && (
            <div className="mt-8 flex justify-end">
                    <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Registration
                  </>
                )}
                    </button>
                  </div>
          )}
          </div>
        )}

        {/* Accommodation Tab Content */}
        {activeTab === 'accommodation' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Accommodation</h3>
              <p className="text-gray-600">Please select your arrival and departure dates</p>
                        </div>

            {/* Date Selection */}
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Check-in:</span>
                    <span className="font-semibold text-gray-900">
                      {arrivalDate ? new Date(arrivalDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Not selected'}
                </span>
                      </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-700">Check-out:</span>
                    <span className="font-semibold text-gray-900">
                      {departureDate ? new Date(departureDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Not selected'}
                      </span>
                    </div>
                  <div className="border-t border-green-300 mt-3 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Number of nights:</span>
                      <span className="text-2xl font-bold text-green-600">{numberOfNights}</span>
                      </div>
                    </div>
                </div>
              )}

              {!arrivalDate && !departureDate && (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
                  <p className="text-gray-500 text-sm">No dates selected</p>
                      </div>
                        )}
                      </div>

            {/* Hotel Selection - Only show when dates are selected */}
            {arrivalDate && departureDate && numberOfNights > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Select Your Hotel</h3>
                <p className="text-sm text-gray-600 mb-6">Choose from available accommodation options</p>

                {(() => {
                  const availableHotels = getAvailableHotels()
                  
                  if (availableHotels.length === 0) {
                    return (
                      <div className="text-center py-8 bg-amber-50 border border-amber-200 rounded-lg">
                        <svg className="w-12 h-12 text-amber-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                        <p className="text-sm font-medium text-amber-800 mb-1">No hotels available for selected dates</p>
                        <p className="text-xs text-amber-600">
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
                                    {totalPrice.toFixed(2)} {currency}
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
                                  <span>{hotel.pricePerNight.toFixed(2)} {currency}/night</span>
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
                  <p className="text-sm text-amber-600 mt-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Please select a hotel to continue
                  </p>
                )}
                  </div>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
