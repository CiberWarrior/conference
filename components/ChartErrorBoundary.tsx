'use client'

import React, { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { BarChart3, RefreshCw } from 'lucide-react'

interface ChartErrorBoundaryProps {
  children: ReactNode
  chartName?: string
}

/**
 * Chart-specific Error Boundary
 * Provides a compact error UI for failed charts/visualizations
 */
export default function ChartErrorBoundary({ children, chartName }: ChartErrorBoundaryProps) {
  const handleError = (error: Error) => {
    console.error(`[Chart Error${chartName ? ` - ${chartName}` : ''}]:`, error)
  }

  const customFallback = (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex flex-col items-center justify-center text-center py-8">
        {/* Icon */}
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-6 h-6 text-gray-400" />
        </div>

        {/* Message */}
        <h4 className="text-sm font-semibold text-gray-700 mb-1">
          {chartName || 'Chart'} Unavailable
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Unable to load this visualization
        </p>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    </div>
  )

  return (
    <ErrorBoundary fallback={customFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}
