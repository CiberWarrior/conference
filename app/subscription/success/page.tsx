'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionSuccessPage() {
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    // Get email from URL params if available
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🎉 Payment Successful!
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Thank you for subscribing to MeetFlow Conference Platform!
          </p>

          {/* What's Next */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-green-600" />
              What happens next?
            </h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span>
                  We're creating your Conference Admin account right now
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span>
                  You'll receive an email{email && ` at ${email}`} with your login credentials within the next few minutes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span>
                  Use those credentials to log in and start creating your first conference!
                </span>
              </li>
            </ol>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Please check your spam folder if you don't see the email within 5 minutes.
              If you need assistance, contact us at{' '}
              <a href="mailto:screatives.info@gmail.com" className="underline">
                screatives.info@gmail.com
              </a>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/admin-login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold"
            >
              Go to Login
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all font-semibold"
            >
              Back to Homepage
            </Link>
          </div>

          {/* Receipt Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              A receipt has been sent to your email address.
              You can also access your invoices from your account dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

