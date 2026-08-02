import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
  hint?: string
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  hint,
}: StatsCardProps) {
  const iconBgClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-amber-50 text-amber-600',
    purple: 'bg-violet-50 text-violet-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 p-5 transition-colors hover:border-gray-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>
          {trend && (
            <p
              className={`mt-2 inline-flex items-center text-xs font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              <svg
                className={`mr-1 h-3.5 w-3.5 ${trend.isPositive ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              {trend.value}
            </p>
          )}
          {!trend && hint && (
            <p className="mt-2 text-xs text-gray-500">{hint}</p>
          )}
        </div>
        <div className={`rounded-md p-2.5 ${iconBgClasses[color]}`}>{icon}</div>
      </div>
    </div>
  )
}
