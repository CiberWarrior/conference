'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Unhandled error:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-8">
          An unexpected error occurred. Please try again or contact support if the problem
          persists.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Go to homepage
          </a>
        </div>
      </div>
    </div>
  )
}
