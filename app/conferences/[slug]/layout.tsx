'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ConferenceNavigation from '@/components/conference/ConferenceNavigation'
import ConferenceFooter from '@/components/conference/ConferenceFooter'
import type { Conference } from '@/types/conference'

export default function ConferenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const slug = params?.slug as string
  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    const loadConference = async () => {
      try {
        setLoading(true)
        // Add cache busting to ensure fresh data
        const response = await fetch(`/api/conferences/${slug}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        const data = await response.json()

        if (response.ok && data.conference) {
          setConference(data.conference)
        }
      } catch (err) {
        console.error('Error loading conference:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConference()
  }, [slug])

  // Show loading state or error if conference not found
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conference...</p>
        </div>
      </div>
    )
  }

  if (!conference) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conference Not Found
          </h1>
          <p className="text-gray-600">
            The conference you are looking for does not exist.
          </p>
        </div>
      </div>
    )
  }

  // Generate CSS variables for branding
  const primaryColor = conference.primary_color || '#3B82F6'
  const secondaryColor = conference.primary_color
    ? adjustColorBrightness(primaryColor, -20)
    : '#6366F1'

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      style={
        {
          '--conference-primary': primaryColor,
          '--conference-secondary': secondaryColor,
        } as React.CSSProperties
      }
    >
      <ConferenceNavigation conference={conference} />
      <main className="flex-1">{children}</main>
      <ConferenceFooter conference={conference} />
    </div>
  )
}

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  )
}

