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
import type { RegistrationFormData } from '@/types/registration'

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
}

export default function RegistrationForm({
  conferenceId,
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
      country: '',
      institution: '',
      arrivalDate: '',
      departureDate: '',
    },
  })

  const paymentRequired = watch('paymentRequired')
  const paymentByCard = watch('paymentByCard')

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          conferenceId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      // If payment is required and paymentByCard is true, show payment form
      if (data.paymentRequired && data.paymentByCard && result.registrationId) {
        setRegistrationId(result.registrationId)
        setShowPaymentForm(true)
      } else {
        setSubmitSuccess({
          message: result.message || 'Registration successful!',
          paymentUrl: result.paymentUrl,
        })

        // Reset form
        if (typeof window !== 'undefined') {
          const form = document.querySelector('form')
          form?.reset()
        }
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An error occurred'
      )
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
  }

  const handlePaymentError = (error: string) => {
    setSubmitError(error)
  }

  if (submitSuccess && !showPaymentForm) {
    return (
      <SuccessMessage
        message={submitSuccess.message}
        paymentUrl={submitSuccess.paymentUrl}
      />
    )
  }

  if (showPaymentForm && registrationId) {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Your Payment
            </h2>
            <p className="text-sm text-gray-600">
              Your registration was successful. Please complete the payment below.
            </p>
          </div>
          <PaymentForm
            registrationId={registrationId}
            amount={paymentAmount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto animate-fade-in"
    >
      <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
        <PaymentSection
          enabled={paymentRequired}
          onToggle={(enabled) => setValue('paymentRequired', enabled)}
        />

        <div className="space-y-5">
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
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-slide-in">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mr-2 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">{submitError}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
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
      </div>
    </form>
  )
}

