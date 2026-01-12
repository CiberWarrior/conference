'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LOYALTY_TIERS } from '@/types/participant-account'

export default function ParticipantDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/participant/dashboard')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    )
  }

  const { profile, stats, upcoming_events, loyalty_info } = data

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile.first_name}!
        </h1>
        <p className="text-blue-100">
          Manage your event registrations and track your participation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_registrations}
              </p>
            </div>
            <div className="text-4xl">🎫</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.upcoming_events}
              </p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Certificates</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.certificates_earned}
              </p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Loyalty Points</p>
              <p className="text-2xl font-bold text-purple-600">
                {loyalty_info.points}
              </p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>
      </div>

      {/* Loyalty Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Loyalty Status
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {loyalty_info.tier} Tier
              </p>
              <p className="text-sm text-gray-600">
                {loyalty_info.events_attended} events attended
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {loyalty_info.discount_percentage}% OFF
            </div>
          </div>

          {loyalty_info.next_tier && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress to {loyalty_info.next_tier}</span>
                <span>
                  {loyalty_info.events_until_next_tier} events to go
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        ((LOYALTY_TIERS[loyalty_info.tier].events_required +
                          (LOYALTY_TIERS[loyalty_info.next_tier]
                            .events_required -
                            LOYALTY_TIERS[loyalty_info.tier].events_required -
                            loyalty_info.events_until_next_tier)) /
                          LOYALTY_TIERS[loyalty_info.next_tier]
                            .events_required) *
                          100
                      )
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Your Benefits:
            </p>
            <ul className="space-y-1">
              {loyalty_info.current_tier_benefits.map(
                (benefit: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {benefit}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
          <Link
            href="/participant/dashboard/events"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </Link>
        </div>

        {upcoming_events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No upcoming events</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming_events.map((event: any) => (
              <div
                key={event.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {event.conference.name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {event.conference.start_date && (
                        <p>
                          📅{' '}
                          {new Date(
                            event.conference.start_date
                          ).toLocaleDateString()}
                          {event.conference.end_date &&
                            ` - ${new Date(event.conference.end_date).toLocaleDateString()}`}
                        </p>
                      )}
                      {event.conference.location && (
                        <p>📍 {event.conference.location}</p>
                      )}
                      <p className="capitalize">
                        Status:{' '}
                        <span
                          className={`font-medium ${
                            event.status === 'confirmed'
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {event.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/participant/dashboard/events/${event.id}`}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
