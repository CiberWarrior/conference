'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

export default function ParticipantEventsPage() {
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  const fetchRegistrations = useCallback(async () => {
    try {
      const response = await fetch('/api/participant/registrations')
      if (response.ok) {
        const data = await response.json()
        setRegistrations(data.registrations)
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'attended':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600'
      case 'pending':
        return 'text-yellow-600'
      case 'refunded':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const filteredRegistrations = registrations.filter((reg) => {
    const now = new Date()
    const endDate = reg.conference?.end_date
      ? new Date(reg.conference.end_date)
      : null

    if (filter === 'upcoming') {
      return (
        reg.status !== 'cancelled' && endDate && endDate >= now
      )
    }
    if (filter === 'past') {
      return (
        reg.status !== 'cancelled' && endDate && endDate < now
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + Register for Event
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`pb-2 px-1 font-medium text-sm ${
              filter === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({registrations.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`pb-2 px-1 font-medium text-sm ${
              filter === 'upcoming'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming (
            {
              registrations.filter(
                (r) =>
                  r.status !== 'cancelled' &&
                  r.conference?.end_date &&
                  new Date(r.conference.end_date) >= new Date()
              ).length
            }
            )
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`pb-2 px-1 font-medium text-sm ${
              filter === 'past'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Past (
            {
              registrations.filter(
                (r) =>
                  r.status !== 'cancelled' &&
                  r.conference?.end_date &&
                  new Date(r.conference.end_date) < new Date()
              ).length
            }
            )
          </button>
        </div>

        {/* Events List */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <p className="text-gray-600 mb-4">No events found</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {registration.conference?.name || 'Event'}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}
                      >
                        {registration.status}
                      </span>
                    </div>

                    {registration.conference?.event_type && (
                      <p className="text-sm text-gray-500 mb-2 capitalize">
                        {registration.conference.event_type}
                      </p>
                    )}

                    <div className="space-y-1 text-sm text-gray-600">
                      {registration.conference?.start_date && (
                        <p>
                          📅{' '}
                          {new Date(
                            registration.conference.start_date
                          ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {registration.conference.end_date &&
                            ` - ${new Date(registration.conference.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
                        </p>
                      )}
                      {registration.conference?.location && (
                        <p>📍 {registration.conference.location}</p>
                      )}
                      {registration.registration_fee_type && (
                        <p className="capitalize">
                          🎫 {registration.registration_fee_type.replace(/_/g, ' ')}
                        </p>
                      )}
                      {registration.amount_paid && (
                        <p>
                          💳{' '}
                          <span
                            className={`font-medium ${getPaymentStatusColor(registration.payment_status)}`}
                          >
                            {registration.currency}{' '}
                            {registration.amount_paid.toFixed(2)} -{' '}
                            {registration.payment_status}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Registered:{' '}
                        {new Date(
                          registration.registered_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Link
                      href={`/participant/dashboard/events/${registration.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm text-center whitespace-nowrap"
                    >
                      View Details
                    </Link>
                    {registration.certificate_id && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                        Certificate
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional info badges */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  {registration.checked_in && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                      ✓ Checked In
                    </span>
                  )}
                  {registration.abstract_submitted && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                      📄 Abstract Submitted
                    </span>
                  )}
                  {registration.accommodation_data && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                      🏨 Accommodation Booked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
