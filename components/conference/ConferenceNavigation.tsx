'use client'

import type { Conference } from '@/types/conference'

interface ConferenceNavigationProps {
  conference: Conference
}

export default function ConferenceNavigation({
  conference,
}: ConferenceNavigationProps) {
  const primaryColor = conference.primary_color || '#3B82F6'

  return (
    <nav
      className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 border-b border-gray-200/50 shadow-sm"
      style={
        conference.primary_color
          ? {
              borderColor: `${primaryColor}20`,
            }
          : {}
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Conference Name Only - Centered */}
          <div className="flex items-center justify-center flex-1">
            <span
              className="text-xl font-bold"
              style={{ color: primaryColor }}
            >
              {conference.name}
            </span>
          </div>

        </div>
      </div>
    </nav>
  )
}

