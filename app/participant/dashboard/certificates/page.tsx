'use client'

import { useEffect, useState } from 'react'

export default function ParticipantCertificatesPage() {
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<any[]>([])

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/participant/registrations')
      if (response.ok) {
        const data = await response.json()
        // Filter only registrations with certificates
        const withCertificates = data.registrations.filter(
          (reg: any) => reg.certificate_id && reg.certificate
        )
        setRegistrations(withCertificates)
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error)
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              My Certificates
            </h1>
            <p className="text-gray-600">
              Download your participation certificates
            </p>
          </div>
          <div className="text-4xl">🏆</div>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Certificates Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Certificates will appear here after you attend events
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Events
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {registration.conference?.name}
                    </h3>
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
                        </p>
                      )}
                      {registration.certificate?.issued_at && (
                        <p className="text-xs text-gray-500">
                          Issued:{' '}
                          {new Date(
                            registration.certificate.issued_at
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl">🏅</div>
                </div>

                <a
                  href={registration.certificate.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Download Certificate
                </a>

                {registration.conference?.location && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    📍 {registration.conference.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          About Certificates
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              Certificates are automatically issued after event completion
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>You can download your certificates anytime</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              All certificates are digitally signed and verifiable
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Contact support if you need duplicate copies</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
