'use client'

interface PaymentSectionProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export default function PaymentSection({
  enabled,
  onToggle,
}: PaymentSectionProps) {
  return (
    <div className="mb-6 p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 card-hover">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <label
              htmlFor="payment-toggle"
              className="text-sm font-semibold text-gray-800 cursor-pointer"
            >
              Payment Required
            </label>
          </div>
          <p className="text-xs text-gray-600 ml-7">
            Enable if registration requires payment
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-200 ${
            enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          aria-label="Toggle payment requirement"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

