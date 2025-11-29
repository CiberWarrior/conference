'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import LoadingSpinner from './LoadingSpinner'

// Only initialize Stripe if publishable key is provided
const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null

interface PaymentFormProps {
  registrationId: string
  amount: number
  conferenceName?: string
  conferenceDate?: string
  conferenceLocation?: string
  onSuccess: (invoiceId?: string, invoiceUrl?: string) => void
  onError: (error: string) => void
}

function PaymentFormContent({
  registrationId,
  amount,
  conferenceName,
  conferenceDate,
  conferenceLocation,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Submit payment
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      })

      if (submitError) {
        setErrorMessage(submitError.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      // If payment succeeded, confirm with backend
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const response = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            registrationId,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to confirm payment')
        }

        onSuccess(result.invoiceId, result.invoiceUrl)
      } else {
        setErrorMessage('Payment was not completed')
        setIsProcessing(false)
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An error occurred'
      setErrorMessage(error)
      onError(error)
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Order Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Order Summary
        </h3>
        
        <div className="space-y-3">
          {/* Conference Name */}
          {conferenceName && (
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">{conferenceName}</p>
                  <p className="text-sm text-gray-600">Registration Fee</p>
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          {conferenceDate && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{conferenceDate}</span>
            </div>
          )}

          {/* Location */}
          {conferenceLocation && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{conferenceLocation}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t-2 border-blue-200 my-4"></div>

          {/* What's Included */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900 mb-2">What's Included:</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Conference attendance</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Access to all sessions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Conference materials</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Digital certificate</span>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="border-t-2 border-blue-200 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">${amount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payment Details
          </h3>
        </div>

      <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
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
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Processing Payment...</span>
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span>Pay €{amount.toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
    </div>
  )
}

export default function PaymentForm({
  registrationId,
  amount,
  conferenceName,
  conferenceDate,
  conferenceLocation,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registrationId,
            amount,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment intent')
        }

        setClientSecret(data.clientSecret)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        onError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (registrationId && amount > 0) {
      createPaymentIntent()
    } else {
      setIsLoading(false)
    }
  }, [registrationId, amount, onError])

  // Check if Stripe is configured (after hooks)
  if (!stripePromise) {
    return (
      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Payment processing is not configured
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Please configure Stripe keys in your environment variables to enable
              payment processing.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-600">Setting up payment...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
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
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return null
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      <PaymentFormContent
        registrationId={registrationId}
        amount={amount}
        conferenceName={conferenceName}
        conferenceDate={conferenceDate}
        conferenceLocation={conferenceLocation}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}

