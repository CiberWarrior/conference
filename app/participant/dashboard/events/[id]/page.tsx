'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EventDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [registration, setRegistration] = useState<any>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [requestRefund, setRequestRefund] = useState(false)

  const fetchRegistration = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/participant/registrations/${params.id}`
      )
      if (response.ok) {
        const data = await response.json()
        setRegistration(data.registration)
      } else {
        router.push('/participant/dashboard/events')
      }
    } catch (error) {
      console.error('Failed to fetch registration:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchRegistration()
  }, [fetchRegistration])

  const handleCancelRegistration = async () => {
    setCancelling(true)
    try {
      const response = await fetch(
        `/api/participant/registrations/${params.id}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: cancelReason,
            request_refund: requestRefund,
          }),
        }
      )

      if (response.ok) {
        alert('Registration cancelled successfully')
        router.push('/participant/dashboard/events')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel registration')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      alert('An error occurred while cancelling')
    } finally {
      setCancelling(false)
      setShowCancelModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Registration not found</p>
      </div>
    )
  }

  const canCancel =
    registration.status === 'confirmed' &&
    registration.conference?.start_date &&
    new Date(registration.conference.start_date) > new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Link
          href="/participant/dashboard/events"
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to events
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {registration.conference?.name}
            </h1>
            {registration.conference?.event_type && (
              <p className="text-gray-600 capitalize">
                {registration.conference.event_type}
              </p>
            )}
          </div>
          <span
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              registration.status === 'confirmed'
                ? 'bg-green-100 text-green-800'
                : registration.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {registration.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Event Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registration.conference?.start_date && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Start Date</p>
              <p className="font-medium">
                {new Date(
                  registration.conference.start_date
                ).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
          {registration.conference?.end_date && (
            <div>
              <p className="text-sm text-gray-600 mb-1">End Date</p>
              <p className="font-medium">
                {new Date(registration.conference.end_date).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>
          )}
          {registration.conference?.location && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Location</p>
              <p className="font-medium">{registration.conference.location}</p>
            </div>
          )}
          {registration.conference?.venue && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Venue</p>
              <p className="font-medium">{registration.conference.venue}</p>
            </div>
          )}
        </div>

        {registration.conference?.website_url && (
          <div className="mt-4 pt-4 border-t">
            <a
              href={registration.conference.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Visit event website →
            </a>
          </div>
        )}
      </div>

      {/* Registration Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Registration Information
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Registration Date</p>
              <p className="font-medium">
                {new Date(registration.registered_at).toLocaleDateString()}
              </p>
            </div>
            {registration.registration_fee_type && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Fee Type</p>
                <p className="font-medium capitalize">
                  {registration.registration_fee_type.replace(/_/g, ' ')}
                </p>
              </div>
            )}
            {registration.amount_paid && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                <p className="font-medium">
                  {registration.currency} {registration.amount_paid.toFixed(2)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Payment Status</p>
              <p
                className={`font-medium ${
                  registration.payment_status === 'paid'
                    ? 'text-green-600'
                    : registration.payment_status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                }`}
              >
                {registration.payment_status.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {registration.checked_in && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                ✓ Checked In
              </span>
            )}
            {registration.abstract_submitted && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                📄 Abstract Submitted
              </span>
            )}
            {registration.accommodation_data && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                🏨 Accommodation Booked
              </span>
            )}
            {registration.certificate_id && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                🏆 Certificate Issued
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Certificate */}
      {registration.certificate && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Certificate</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-2">
                Your certificate is ready for download
              </p>
              <p className="text-sm text-gray-500">
                Issued on:{' '}
                {new Date(
                  registration.certificate.issued_at
                ).toLocaleDateString()}
              </p>
            </div>
            <a
              href={registration.certificate.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Download Certificate
            </a>
          </div>
        </div>
      )}

      {/* Cancel Registration */}
      {canCancel && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Cancel Registration
          </h2>
          <p className="text-gray-600 mb-4">
            Need to cancel your registration? We'll process your request and
            notify you about refund options.
          </p>
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Cancel Registration
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cancel Registration
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel your registration for this event?
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Please tell us why you're cancelling..."
                />
              </div>

              {registration.payment_status === 'paid' && (
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="refund"
                    checked={requestRefund}
                    onChange={(e) => setRequestRefund(e.target.checked)}
                    className="mt-1 mr-2"
                  />
                  <label htmlFor="refund" className="text-sm text-gray-700">
                    Request a refund (subject to event's refund policy)
                  </label>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={cancelling}
                >
                  Keep Registration
                </button>
                <button
                  onClick={handleCancelRegistration}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
