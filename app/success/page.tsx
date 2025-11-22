'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verify payment status if session_id is present
    if (sessionId) {
      // Payment was successful
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [sessionId])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Processing...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-green-600 mx-auto"
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {sessionId ? 'Payment Successful!' : 'Registration Complete!'}
        </h1>
        <p className="text-gray-600 mb-6">
          {sessionId
            ? 'Your payment has been processed successfully. You will receive a confirmation email shortly.'
            : 'Your registration has been received. You will receive a confirmation email shortly.'}
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </a>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}

