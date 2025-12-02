'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, CreditCard, FileText, LogOut, Building2, User, Mail, Phone, Globe } from 'lucide-react'
import Link from 'next/link'

interface Registration {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  country: string
  institution: string
  conference_id: string | null
  payment_status: string
  payment_required: boolean
  arrival_date: string
  departure_date: string
  created_at: string
  conferences?: {
    id: string
    name: string
    slug: string
    start_date: string
    end_date: string
    location: string
    venue: string
    logo_url: string
  }
}

export default function UserDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)
      await loadRegistrations()
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadRegistrations = async () => {
    try {
      const response = await fetch('/api/user/registrations')
      const data = await response.json()

      if (response.ok) {
        setRegistrations(data.registrations || [])
      } else {
        console.error('Failed to load registrations:', data.error)
      }
    } catch (error) {
      console.error('Error loading registrations:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      // Call logout API to log activity
      await fetch('/api/auth/user-logout', { method: 'POST' })
      
      // Sign out
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'not_required':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'pending':
        return 'Pending Payment'
      case 'not_required':
        return 'Not Required'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black text-gray-900">MeetFlow</span>
              </Link>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Account</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.email}</p>
              <p className="text-sm text-gray-600">Conference Participant</p>
            </div>
          </div>
        </div>

        {/* Registrations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">My Registrations</h2>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              Browse Conferences →
            </Link>
          </div>

          {registrations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Registrations Found</h3>
              <p className="text-gray-600 mb-6">
                You haven't registered for any conferences yet.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg"
              >
                Browse Conferences
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Conference Header */}
                  {reg.conferences && (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2">{reg.conferences.name}</h3>
                          <div className="flex flex-wrap gap-4 text-sm">
                            {reg.conferences.start_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(reg.conferences.start_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                  {reg.conferences.end_date && reg.conferences.end_date !== reg.conferences.start_date && (
                                    <> - {new Date(reg.conferences.end_date).toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                    })}</>
                                  )}
                                </span>
                              </div>
                            )}
                            {reg.conferences.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{reg.conferences.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {reg.conferences.logo_url && (
                          <img
                            src={reg.conferences.logo_url}
                            alt={reg.conferences.name}
                            className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Registration Details */}
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Personal Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{reg.first_name} {reg.last_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{reg.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{reg.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{reg.country}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{reg.institution}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Registration Details
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border ${getPaymentStatusColor(reg.payment_status)}`}>
                              <CreditCard className="w-4 h-4" />
                              {getPaymentStatusText(reg.payment_status)}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Arrival Date</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {new Date(reg.arrival_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Departure Date</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {new Date(reg.departure_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Registered On</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {new Date(reg.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {reg.conferences?.slug && (
                      <div className="pt-4 border-t border-gray-200">
                        <Link
                          href={`/conferences/${reg.conferences.slug}`}
                          className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                        >
                          View Conference Details →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

