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
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="payment-toggle"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Payment Required
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Enable if registration requires payment
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

