'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PaymentSection from './PaymentSection'
import PaymentForm from './PaymentForm'
import SupportedCards from './SupportedCards'
import SuccessMessage from './SuccessMessage'
import LoadingSpinner from './LoadingSpinner'
import { showSuccess, showError } from '@/utils/toast'
import type { RegistrationFormData, AccompanyingPerson } from '@/types/registration'
import type { ConferencePricing } from '@/types/conference'
import { getCurrentPricing, formatPrice, getTierDisplayName } from '@/utils/pricing'
import { Plus, X, Clock, AlertCircle } from 'lucide-react'

const registrationSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(5, 'Phone number must be at least 5 characters'),
    country: z.string().min(2, 'Country is required'),
    institution: z.string().min(2, 'Institution is required'),
    arrivalDate: z.string().min(1, 'Arrival date is required'),
    departureDate: z.string().min(1, 'Departure date is required'),
    paymentRequired: z.boolean(),
    paymentByCard: z.boolean(),
    accompanyingPersons: z.boolean({
      required_error: 'Please indicate if you will bring accompanying persons',
    }),
    galaDinner: z.boolean({
      required_error: 'Please indicate if you will attend Gala Dinner',
    }),
    presentationType: z.boolean({
      required_error: 'Please indicate if you intend to have poster/spoken presentation',
    }),
    abstractSubmission: z.boolean({
      required_error: 'Please indicate if you will submit an abstract',
    }),
  })
  .refine(
    (data) => {
      if (data.arrivalDate && data.departureDate) {
        return new Date(data.departureDate) >= new Date(data.arrivalDate)
      }
      return true
    },
    {
      message: 'Departure date must be after or equal to arrival date',
      path: ['departureDate'],
    }
  )

interface RegistrationFormProps {
  conferenceId?: string
  conferenceName?: string
  conferenceDate?: string
  conferenceLocation?: string
  pricing?: ConferencePricing
  conferenceStartDate?: string // ISO date string for late registration logic
}

export default function RegistrationForm({
  conferenceId,
  conferenceName,
  conferenceDate,
  conferenceLocation,
  pricing,
  conferenceStartDate,
}: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<{
    message: string
    paymentUrl?: string
  } | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [paymentAmount] = useState(50) // Default amount - can be made configurable
  const [accompanyingPersonsList, setAccompanyingPersonsList] = useState<
    AccompanyingPerson[]
  >([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      paymentRequired: false,
      paymentByCard: false,
      accompanyingPersons: false,
      galaDinner: false,
      presentationType: false,
      abstractSubmission: false,
      country: '',
      institution: '',
      arrivalDate: '',
      departureDate: '',
    },
  })

  const paymentRequired = watch('paymentRequired')
  const paymentByCard = watch('paymentByCard')
  const accompanyingPersons = watch('accompanyingPersons')

  // Functions to manage accompanying persons list
  const addAccompanyingPerson = () => {
    setAccompanyingPersonsList([
      ...accompanyingPersonsList,
      {
        firstName: '',
        lastName: '',
        arrivalDate: '',
        departureDate: '',
      },
    ])
  }

  const removeAccompanyingPerson = (index: number) => {
    setAccompanyingPersonsList(
      accompanyingPersonsList.filter((_, i) => i !== index)
    )
  }

  const updateAccompanyingPerson = (
    index: number,
    field: keyof AccompanyingPerson,
    value: string
  ) => {
    const updated = [...accompanyingPersonsList]
    updated[index] = { ...updated[index], [field]: value }
    setAccompanyingPersonsList(updated)
  }

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      // Prepare form data
      const formData = {
        ...data,
        accompanyingPersonsData:
          accompanyingPersons && accompanyingPersonsList.length > 0
            ? accompanyingPersonsList
            : [],
        conferenceId,
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        // Show detailed error message
        const errorMsg = result.error || 'Registration failed'
        const details = result.details ? ` Details: ${result.details}` : ''
        const code = result.code ? ` (Code: ${result.code})` : ''
        throw new Error(`${errorMsg}${details}${code}`)
      }

      // If payment is required and paymentByCard is true, show payment form
      if (data.paymentRequired && data.paymentByCard && result.registrationId) {
        setRegistrationId(result.registrationId)
        setShowPaymentForm(true)
        showSuccess('Registration successful! Please complete your payment.')
      } else {
        setSubmitSuccess({
          message: result.message || 'Registration successful!',
          paymentUrl: result.paymentUrl,
        })
        showSuccess('Registration successful! You will receive a confirmation email shortly.')

        // Reset form
        if (typeof window !== 'undefined') {
          const form = document.querySelector('form')
          form?.reset()
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setSubmitError(errorMessage)
      showError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = (invoiceId?: string, invoiceUrl?: string) => {
    setShowPaymentForm(false)
    setSubmitSuccess({
      message: 'Registration and payment successful! You will receive a confirmation email with your invoice shortly.',
      paymentUrl: invoiceUrl,
    })
    showSuccess('Payment completed! You will receive a confirmation email with your invoice shortly.')
  }

  const handlePaymentError = (error: string) => {
    setSubmitError(error)
    showError(error)
  }

  if (submitSuccess && !showPaymentForm) {
    return (
      <SuccessMessage
        message={submitSuccess.message}
        paymentUrl={submitSuccess.paymentUrl}
      />
    )
  }

  // Calculate current pricing dynamically based on date
  const conferenceStart = conferenceStartDate ? new Date(conferenceStartDate) : undefined
  const currentPricing = pricing
    ? getCurrentPricing(pricing, new Date(), conferenceStart)
    : null
  const tierDisplayName = currentPricing ? getTierDisplayName(currentPricing.tier) : ''

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-4xl mx-auto animate-fade-in"
    >
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
        {/* Pricing Information Section */}
        {currentPricing &&
          (currentPricing.participantPrice > 0 ||
            currentPricing.studentPrice > 0 ||
            currentPricing.accompanyingPersonPrice > 0) && (
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Registration Fees ({tierDisplayName})
                </h3>
                {currentPricing.tier === 'early_bird' && currentPricing.deadline && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="font-semibold">
                      Until{' '}
                      {new Date(currentPricing.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {currentPricing.participantPrice > 0 && (
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      Participant
                    </div>
                    <div className="text-2xl font-black text-blue-600">
                      {formatPrice(
                        currentPricing.participantPrice,
                        currentPricing.currency
                      )}
                    </div>
                  </div>
                )}
                {currentPricing.studentPrice > 0 && (
                  <div className="bg-white p-4 rounded-lg border-2 border-green-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      Student
                    </div>
                    <div className="text-2xl font-black text-green-600">
                      {formatPrice(currentPricing.studentPrice, currentPricing.currency)}
                    </div>
                    {currentPricing.participantPrice > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Save{' '}
                        {formatPrice(
                          currentPricing.participantPrice - currentPricing.studentPrice,
                          currentPricing.currency
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="bg-white p-4 rounded-lg border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-gray-600 mb-1">
                    Accompanying Person
                  </div>
                  <div className="text-2xl font-black text-purple-600">
                    {currentPricing.accompanyingPersonPrice > 0
                      ? formatPrice(
                          currentPricing.accompanyingPersonPrice,
                          currentPricing.currency
                        )
                      : 'Not set'}
                  </div>
                </div>
              </div>

              {currentPricing.tier === 'early_bird' && currentPricing.nextTier && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Early Bird Pricing Active</span>
                      {currentPricing.deadline && (
                        <span className="ml-1">
                          — Prices will increase to{' '}
                          {pricing?.regular?.amount
                            ? formatPrice(pricing.regular.amount, currentPricing.currency)
                            : 'regular rates'}{' '}
                          after{' '}
                          {new Date(currentPricing.deadline).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        <PaymentSection
          enabled={paymentRequired}
          onToggle={(enabled) => setValue('paymentRequired', enabled)}
        />

        <div className="space-y-6">
          {/* First Name and Last Name in two columns */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <label
                htmlFor="firstName"
                className="flex items-center text-sm font-semibold text-gray-700 mb-2"
              >
                <svg
                  className="w-4 h-4 mr-1 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                First Name *
              </label>
              <div className="relative">
                <input
                  {...register('firstName')}
                  type="text"
                  id="firstName"
                  className={`w-full px-4 py-3 pl-10 border-2 rounded-lg transition-all duration-200 ${
                    errors.firstName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter your first name"
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              {errors.firstName && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <label
                htmlFor="lastName"
                className="flex items-center text-sm font-semibold text-gray-700 mb-2"
              >
                <svg
                  className="w-4 h-4 mr-1 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Last Name *
              </label>
              <div className="relative">
                <input
                  {...register('lastName')}
                  type="text"
                  id="lastName"
                  className={`w-full px-4 py-3 pl-10 border-2 rounded-lg transition-all duration-200 ${
                    errors.lastName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter your last name"
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              {errors.lastName && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email and Phone in two columns */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
              <label
                htmlFor="email"
                className="flex items-center text-sm font-semibold text-gray-700 mb-2"
              >
                <svg
                  className="w-4 h-4 mr-1 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email *
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className={`w-full px-4 py-3 pl-10 border-2 rounded-lg transition-all duration-200 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2`}
                  placeholder="your.email@example.com"
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
              <label
                htmlFor="phone"
                className="flex items-center text-sm font-semibold text-gray-700 mb-2"
              >
                <svg
                  className="w-4 h-4 mr-1 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Phone *
              </label>
              <div className="relative">
                <input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  className={`w-full px-4 py-3 pl-10 border-2 rounded-lg transition-all duration-200 ${
                    errors.phone
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2`}
                  placeholder="+1 (555) 123-4567"
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Country and Institution in two columns */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="animate-slide-in" style={{ animationDelay: '0.5s' }}>
              <label
                htmlFor="country"
                className="flex items-center text-sm font-semibold text-gray-700 mb-2"
              >
                <svg
                  className="w-4 h-4 mr-1 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Country *
              </label>
              <div className="relative">
                <select
                  {...register('country')}
                  id="country"
                  className={`w-full px-4 py-3 pl-10 border-2 rounded-lg transition-all duration-200 appearance-none ${
                    errors.country
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2 bg-white`}
                >
                  <option value="">Select your country</option>
                  <option value="HR">Croatia</option>
                  <option value="RS">Serbia</option>
                  <option value="BA">Bosnia and Herzegovina</option>
                  <option value="SI">Slovenia</option>
                  <option value="ME">Montenegro</option>
                  <option value="MK">North Macedonia</option>
                  <option value="AL">Albania</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="IT">Italy</option>
                  <option value="ES">Spain</option>
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="AT">Austria</option>
                  <option value="CH">Switzerland</option>
                  <option value="SE">Sweden</option>
                  <option value="NO">Norway</option>
                  <option value="DK">Denmark</option>
                  <option value="FI">Finland</option>
                  <option value="PL">Poland</option>
                  <option value="CZ">Czech Republic</option>
                  <option value="SK">Slovakia</option>
                  <option value="HU">Hungary</option>
                  <option value="RO">Romania</option>
                  <option value="BG">Bulgaria</option>
                  <option value="GR">Greece</option>
                  <option value="PT">Portugal</option>
                  <option value="IE">Ireland</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="NZ">New Zealand</option>
                  <option value="JP">Japan</option>
                  <option value="CN">China</option>
                  <option value="IN">India</option>
                  <option value="BR">Brazil</option>
                  <option value="AR">Argentina</option>
                  <option value="MX">Mexico</option>
                  <option value="ZA">South Africa</option>
                  <option value="EG">Egypt</option>
                  <option value="TR">Turkey</option>
                  <option value="RU">Russia</option>
                  <option value="UA">Ukraine</option>
                  <option value="OTHER">Other</option>
                </select>
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {errors.country && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.country.message}
                </p>
              )}
            </div>

            <div className="animate-slide-in" style={{ animationDelay: '0.6s' }}>
              <label
                htmlFor="institution"
                className="flex items-center text-sm font-semibold text-gray-700 mb-2"
              >
                <svg
                  className="w-4 h-4 mr-1 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Institution *
              </label>
              <div className="relative">
                <input
                  {...register('institution')}
                  type="text"
                  id="institution"
                  className={`w-full px-4 py-3 pl-10 border-2 rounded-lg transition-all duration-200 ${
                    errors.institution
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2`}
                  placeholder="University, Company, Organization..."
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              {errors.institution && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.institution.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="animate-slide-in" style={{ animationDelay: '0.7s' }}>
              <label
                htmlFor="arrivalDate"
                className="flex items-center text-sm font-semibold text-gray-700 mb-2"
              >
                <svg
                  className="w-4 h-4 mr-1 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Arrival Date *
              </label>
              <div className="relative">
                <input
                  {...register('arrivalDate')}
                  type="date"
                  id="arrivalDate"
                  className={`w-full px-4 py-3 pl-10 border-2 rounded-lg transition-all duration-200 ${
                    errors.arrivalDate
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2`}
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {errors.arrivalDate && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.arrivalDate.message}
                </p>
              )}
            </div>

            <div className="animate-slide-in" style={{ animationDelay: '0.8s' }}>
              <label
                htmlFor="departureDate"
                className="flex items-center text-sm font-semibold text-gray-700 mb-2"
              >
                <svg
                  className="w-4 h-4 mr-1 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Departure Date *
              </label>
              <div className="relative">
                <input
                  {...register('departureDate')}
                  type="date"
                  id="departureDate"
                  className={`w-full px-4 py-3 pl-10 border-2 rounded-lg transition-all duration-200 ${
                    errors.departureDate
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2`}
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {errors.departureDate && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.departureDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="animate-slide-in" style={{ animationDelay: '0.85s' }}>
            <label
              className="flex items-center text-sm font-semibold text-gray-700 mb-3"
            >
              <svg
                className="w-4 h-4 mr-1 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Accompanying Persons *
            </label>
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
              <div className="mb-3">
                {/* Yes/No Selection Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('accompanyingPersons', true, {
                        shouldValidate: true,
                      })
                    }}
                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      watch('accompanyingPersons') === true
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          watch('accompanyingPersons') === true
                            ? 'border-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {watch('accompanyingPersons') === true && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span
                        className={`text-base font-semibold ${
                          watch('accompanyingPersons') === true
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        Yes
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('accompanyingPersons', false, {
                        shouldValidate: true,
                      })
                      setAccompanyingPersonsList([])
                    }}
                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      watch('accompanyingPersons') === false
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          watch('accompanyingPersons') === false
                            ? 'border-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {watch('accompanyingPersons') === false && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span
                        className={`text-base font-semibold ${
                          watch('accompanyingPersons') === false
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        No
                      </span>
                    </div>
                  </button>
                </div>
                {/* Hidden input for form submission */}
                <input
                  {...register('accompanyingPersons')}
                  type="checkbox"
                  className="hidden"
                />
              </div>

              {/* Conditional form for accompanying persons details */}
              {accompanyingPersons === true && (
                <div className="mt-6 pt-6 border-t-2 border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Accompanying Persons Details
                    </h4>
                    <button
                      type="button"
                      onClick={addAccompanyingPerson}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Person
                    </button>
                  </div>

                  {accompanyingPersonsList.length === 0 && (
                    <p className="text-sm text-gray-500 italic mb-4">
                      Click "Add Person" to add accompanying person details
                    </p>
                  )}

                  <div className="space-y-4">
                    {accompanyingPersonsList.map((person, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white rounded-lg border-2 border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-sm font-semibold text-gray-700">
                            Person {index + 1}
                          </h5>
                          <button
                            type="button"
                            onClick={() => removeAccompanyingPerson(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              First Name *
                            </label>
                            <input
                              type="text"
                              value={person.firstName}
                              onChange={(e) =>
                                updateAccompanyingPerson(
                                  index,
                                  'firstName',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="First name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              value={person.lastName}
                              onChange={(e) =>
                                updateAccompanyingPerson(
                                  index,
                                  'lastName',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="Last name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Arrival Date *
                            </label>
                            <input
                              type="date"
                              value={person.arrivalDate}
                              onChange={(e) =>
                                updateAccompanyingPerson(
                                  index,
                                  'arrivalDate',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Departure Date *
                            </label>
                            <input
                              type="date"
                              value={person.departureDate}
                              onChange={(e) =>
                                updateAccompanyingPerson(
                                  index,
                                  'departureDate',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600 mt-3">
                Please select Yes if you plan to bring accompanying persons to
                the conference
              </p>
            </div>
            {errors.accompanyingPersons && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.accompanyingPersons.message}
              </p>
            )}
          </div>

          {/* Gala Dinner Field */}
          <div className="animate-slide-in" style={{ animationDelay: '0.87s' }}>
            <label
              className="flex items-center text-sm font-semibold text-gray-700 mb-3"
            >
              <svg
                className="w-4 h-4 mr-1 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Please select if you will attend Gala Dinner *
            </label>
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-900 block mb-4">
                  Will you attend Gala Dinner?
                </span>
                {/* Yes/No Selection Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('galaDinner', true, {
                        shouldValidate: true,
                      })
                    }}
                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      watch('galaDinner') === true
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          watch('galaDinner') === true
                            ? 'border-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {watch('galaDinner') === true && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span
                        className={`text-base font-semibold ${
                          watch('galaDinner') === true
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        Yes
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('galaDinner', false, {
                        shouldValidate: true,
                      })
                    }}
                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      watch('galaDinner') === false
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          watch('galaDinner') === false
                            ? 'border-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {watch('galaDinner') === false && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span
                        className={`text-base font-semibold ${
                          watch('galaDinner') === false
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        No
                      </span>
                    </div>
                  </button>
                </div>
                {/* Hidden input for form submission */}
                <input
                  {...register('galaDinner')}
                  type="checkbox"
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Please select Yes if you plan to attend the Gala Dinner
              </p>
            </div>
            {errors.galaDinner && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.galaDinner.message}
              </p>
            )}
          </div>

          {/* Presentation Type Field */}
          <div className="animate-slide-in" style={{ animationDelay: '0.88s' }}>
            <label
              className="flex items-center text-sm font-semibold text-gray-700 mb-3"
            >
              <svg
                className="w-4 h-4 mr-1 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Select if you intend to have poster/spoken presentation *
            </label>
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-900 block mb-4">
                  Do you intend to have poster/spoken presentation?
                </span>
                {/* Yes/No Selection Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('presentationType', true, {
                        shouldValidate: true,
                      })
                    }}
                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      watch('presentationType') === true
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          watch('presentationType') === true
                            ? 'border-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {watch('presentationType') === true && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span
                        className={`text-base font-semibold ${
                          watch('presentationType') === true
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        Yes
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('presentationType', false, {
                        shouldValidate: true,
                      })
                    }}
                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      watch('presentationType') === false
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          watch('presentationType') === false
                            ? 'border-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {watch('presentationType') === false && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span
                        className={`text-base font-semibold ${
                          watch('presentationType') === false
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        No
                      </span>
                    </div>
                  </button>
                </div>
                {/* Hidden input for form submission */}
                <input
                  {...register('presentationType')}
                  type="checkbox"
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Please select Yes if you intend to have poster/spoken presentation
              </p>
            </div>
            {errors.presentationType && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.presentationType.message}
              </p>
            )}
          </div>

          {/* Abstract Submission Field */}
          <div className="animate-slide-in" style={{ animationDelay: '0.89s' }}>
            <label
              className="flex items-center text-sm font-semibold text-gray-700 mb-3"
            >
              <svg
                className="w-4 h-4 mr-1 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Abstract Submission *
            </label>
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-900 block mb-4">
                  Will you submit an abstract?
                </span>
                {/* Yes/No Selection Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('abstractSubmission', true, {
                        shouldValidate: true,
                      })
                    }}
                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      watch('abstractSubmission') === true
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          watch('abstractSubmission') === true
                            ? 'border-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {watch('abstractSubmission') === true && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span
                        className={`text-base font-semibold ${
                          watch('abstractSubmission') === true
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        Yes
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('abstractSubmission', false, {
                        shouldValidate: true,
                      })
                    }}
                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      watch('abstractSubmission') === false
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          watch('abstractSubmission') === false
                            ? 'border-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {watch('abstractSubmission') === false && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span
                        className={`text-base font-semibold ${
                          watch('abstractSubmission') === false
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        No
                      </span>
                    </div>
                  </button>
                </div>
                {/* Hidden input for form submission */}
                <input
                  {...register('abstractSubmission')}
                  type="checkbox"
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Please select Yes if you will submit an abstract
              </p>
            </div>
            {errors.abstractSubmission && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.abstractSubmission.message}
              </p>
            )}
          </div>

          <div className="animate-slide-in" style={{ animationDelay: '0.9s' }}>
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <input
                {...register('paymentByCard')}
                type="checkbox"
                id="paymentByCard"
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label
                htmlFor="paymentByCard"
                className="ml-3 flex-1 cursor-pointer"
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900">
                    Payment by Card
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {paymentRequired
                    ? 'Plaćanje će se izvršiti direktno u formi nakon registracije (nećete biti preusmjereni)'
                    : 'I will pay the registration fee by credit/debit card'}
                </p>
              </label>
            </div>
            <SupportedCards show={paymentByCard && paymentRequired} />
            {paymentRequired && !paymentByCard && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-amber-600 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-800 mb-1">
                      Online plaćanje
                    </p>
                    <p className="text-xs text-amber-700">
                      Nakon registracije, bit ćete preusmjereni na Stripe Checkout stranicu za sigurno online plaćanje.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <div className="mt-6 p-5 bg-red-50 border-2 border-red-300 rounded-xl animate-slide-in shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900 mb-1">Registration Error</h4>
                <p className="text-sm text-red-800 mb-2">{submitError}</p>
                <div className="text-xs text-red-600 bg-red-100 p-2 rounded mt-2">
                  <p className="font-semibold mb-1">Troubleshooting:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Check that all required fields are filled</li>
                    <li>Verify email address is correct and not already registered</li>
                    <li>Ensure dates are valid (departure after arrival)</li>
                    <li>If you selected "Accompanying Persons", make sure you added at least one person</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || showPaymentForm}
          className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
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
              <span>Register Now</span>
            </>
          )}
        </button>

        {/* Payment Form - Shown after successful registration */}
        {showPaymentForm && registrationId && (
          <div className="mt-8 pt-8 border-t-2 border-gray-200 animate-slide-in">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Registration Successful!
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Please complete your payment to finalize your registration
                    </p>
                  </div>
                </div>
              </div>
              <PaymentForm
                registrationId={registrationId}
                amount={paymentAmount}
                conferenceName={conferenceName}
                conferenceDate={conferenceDate}
                conferenceLocation={conferenceLocation}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

