'use client'

interface SupportedCardsProps {
  show: boolean
}

export default function SupportedCards({ show }: SupportedCardsProps) {
  if (!show) return null

  const cards = [
    {
      name: 'Visa',
      svg: (
        <svg viewBox="0 0 48 32" className="w-full h-8">
          <rect width="48" height="32" rx="4" fill="#1434CB" />
          <path
            d="M20.5 11.5h-3.5l-2.5 9h3.5l1-3.5h2.5l1 3.5h3.5l-2-9zm-1.5 5.5l1-3 1 3h-2z"
            fill="white"
          />
        </svg>
      ),
      color: 'from-blue-600 to-blue-700',
    },
    {
      name: 'Mastercard',
      svg: (
        <svg viewBox="0 0 48 32" className="w-full h-8">
          <rect width="48" height="32" rx="4" fill="#EB001B" />
          <circle cx="18" cy="16" r="6" fill="#FF5F00" />
          <circle cx="30" cy="16" r="6" fill="#F79E1B" />
        </svg>
      ),
      color: 'from-red-500 to-orange-500',
    },
    {
      name: 'American Express',
      svg: (
        <svg viewBox="0 0 48 32" className="w-full h-8">
          <rect width="48" height="32" rx="4" fill="#006FCF" />
          <text x="24" y="20" fill="white" fontSize="10" textAnchor="middle" fontWeight="bold">
            AMEX
          </text>
        </svg>
      ),
      color: 'from-blue-500 to-green-500',
    },
    {
      name: 'PBZ',
      svg: (
        <svg viewBox="0 0 48 32" className="w-full h-8">
          <rect width="48" height="32" rx="4" fill="#8B5CF6" />
          <text x="24" y="20" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">
            PBZ
          </text>
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Maestro',
      svg: (
        <svg viewBox="0 0 48 32" className="w-full h-8">
          <rect width="48" height="32" rx="4" fill="#4A5568" />
          <text x="24" y="20" fill="white" fontSize="7" textAnchor="middle" fontWeight="bold">
            MAESTRO
          </text>
        </svg>
      ),
      color: 'from-gray-600 to-gray-700',
    },
    {
      name: 'Discover',
      svg: (
        <svg viewBox="0 0 48 32" className="w-full h-8">
          <rect width="48" height="32" rx="4" fill="#FF6000" />
          <circle cx="24" cy="16" r="4" fill="white" />
        </svg>
      ),
      color: 'from-orange-500 to-red-500',
    },
  ]

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 animate-slide-in">
      <div className="flex items-center mb-3">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm font-semibold text-gray-800">
          Podržane kartice:
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((card, index) => (
          <div
            key={card.name}
            className={`flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 border-2 border-gray-100`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="w-full h-8 mb-2 flex items-center justify-center">
              {card.svg}
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
              {card.name}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center justify-center gap-2">
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
          <p className="text-xs text-gray-600 text-center">
            Sigurno plaćanje putem Stripe platforme
          </p>
        </div>
      </div>
    </div>
  )
}

