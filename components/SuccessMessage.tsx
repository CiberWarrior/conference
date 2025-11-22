'use client'

interface SuccessMessageProps {
  message: string
  paymentUrl?: string
}

export default function SuccessMessage({
  message,
  paymentUrl,
}: SuccessMessageProps) {
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center mb-4">
        <svg
          className="w-6 h-6 text-green-600 mr-2"
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
        <h2 className="text-xl font-semibold text-green-800">
          Registration Successful!
        </h2>
      </div>
      <p className="text-green-700 mb-4">{message}</p>
      {paymentUrl && (
        <a
          href={paymentUrl}
          className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Proceed to Payment
        </a>
      )}
    </div>
  )
}

