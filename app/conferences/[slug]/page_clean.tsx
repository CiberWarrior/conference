'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import RegistrationForm from '@/components/RegistrationForm'
import {
  Calendar,
  MapPin,
  Users,
  Upload,
  ArrowRight,
  Globe,
  Clock,
  CheckCircle,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { ABSTRACT_APP_URL } from '@/constants/config'
import type { Conference } from '@/types/conference'

export default function ConferencePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const loadConference = async () => {
      try {
        setLoading(true)
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/conferences/${slug}?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Conference not found')
          return
        }

        setConference(data.conference)
      } catch (err) {
        setError('Failed to load conference')
        console.error('Error loading conference:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConference()
  }, [slug])

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conference...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !conference) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Conference Not Found
            </h1>
            <p className="text-gray-600 mb-6">{error || 'The conference you are looking for does not exist.'}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const settings = conference.settings || {}
  const pricing = conference.pricing || {}
  const registrationEnabled = settings.registration_enabled !== false
  const abstractAppUrl = `${ABSTRACT_APP_URL}?conference=${conference.id}`

  return (
    <>
      <main className="min-h-screen bg-white">
        <p>Test page - checking if syntax is OK</p>
      </main>
    </>
  )
}
