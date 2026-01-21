'use client'

import { useState } from 'react'
import { CreditCard, Building2, Upload, CheckCircle } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

interface PaymentOptionsProps {
  amount: number
  currency: string
  registrationId?: string // Ako je registracija već kreirana
  onPaymentMethodSelected: (method: 'card' | 'bank') => void
  allowCard?: boolean
  allowBank?: boolean
  isProcessing?: boolean
}

export default function PaymentOptions({
  amount,
  currency,
  registrationId,
  onPaymentMethodSelected,
  allowCard = true,
  allowBank = true,
  isProcessing = false,
}: PaymentOptionsProps) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank' | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)

  const handleMethodSelect = (method: 'card' | 'bank') => {
    setSelectedMethod(method)
  }

  const handleContinue = () => {
    if (selectedMethod) {
      onPaymentMethodSelected(selectedMethod)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
        <p className="text-gray-600">Choose how you'd like to pay</p>
        <div className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-2xl shadow-lg">
          {amount.toFixed(2)} {currency}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        {/* Credit/Debit Card */}
        {allowCard && (
          <button
            onClick={() => handleMethodSelect('card')}
            disabled={isProcessing}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
              selectedMethod === 'card'
                ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-100'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">Credit/Debit Card</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                    Instant
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Pay securely with Stripe. Your registration will be confirmed immediately.
                </p>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Secure payment processing</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Instant confirmation email</span>
                </div>
              </div>
              <input
                type="radio"
                name="payment_method"
                checked={selectedMethod === 'card'}
                onChange={() => {}}
                className="mt-1 w-5 h-5 text-blue-600"
              />
            </div>
          </button>
        )}

        {/* Bank Transfer */}
        {allowBank && (
          <button
            onClick={() => handleMethodSelect('bank')}
            disabled={isProcessing}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
              selectedMethod === 'bank'
                ? 'border-green-500 bg-green-50 shadow-lg ring-4 ring-green-100'
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">Bank Transfer</h3>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                    1-2 days
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Transfer to our bank account. We'll send you the details via email.
                </p>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Bank details sent via email</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Manual verification within 1-2 days</span>
                </div>
              </div>
              <input
                type="radio"
                name="payment_method"
                checked={selectedMethod === 'bank'}
                onChange={() => {}}
                className="mt-1 w-5 h-5 text-green-600"
              />
            </div>
          </button>
        )}
      </div>

      {/* Bank Transfer Instructions (if selected) */}
      {selectedMethod === 'bank' && (
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">What happens next:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">1.</span>
                  <span>Complete your registration (click Continue below)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">2.</span>
                  <span>You'll receive bank details and payment reference via email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">3.</span>
                  <span>Transfer the amount within 7 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">4.</span>
                  <span>We'll verify and confirm your registration</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Optional: Upload proof */}
          <div className="pt-4 border-t border-green-200">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              Upload Proof of Payment (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 cursor-pointer"
            />
            {proofFile && (
              <p className="mt-2 text-xs text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {proofFile.name} ready to upload
              </p>
            )}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!selectedMethod || isProcessing}
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <LoadingSpinner size="sm" />
            Processing...
          </>
        ) : selectedMethod === 'card' ? (
          <>
            <CreditCard className="w-5 h-5" />
            Continue to Stripe Checkout
          </>
        ) : selectedMethod === 'bank' ? (
          <>
            <Building2 className="w-5 h-5" />
            Complete Registration
          </>
        ) : (
          'Select Payment Method'
        )}
      </button>

      {/* Security Badge */}
      <div className="text-center pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
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
          Secure payment • Your data is protected
        </div>
      </div>
    </div>
  )
}
