'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import RegistrationForm from '@/components/RegistrationForm'
import AbstractUploadForm from '@/components/AbstractUploadForm'
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
} from 'lucide-react'
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
        // Add cache busting with timestamp to ensure fresh data
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
  const abstractSubmissionEnabled =
    settings.abstract_submission_enabled !== false

  return (
    <>
      {/* Hero Section - Compact with text left, logo right */}
      <section className="relative py-8 md:py-12 bg-gradient-to-br from-red-800 via-red-900 to-red-950 text-white overflow-hidden">
        {/* Geometric pattern background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-[5%] w-64 h-64 bg-red-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-[5%] w-80 h-80 bg-red-600/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-left">
              {/* Main Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight text-white">
                {conference.name}
              </h1>

              {/* Description */}
              {conference.description && (
                <p className="text-lg md:text-xl mb-6 text-red-100 leading-relaxed">
                  {conference.description}
                </p>
              )}

              {/* Conference Details - Horizontal layout */}
              <div className="flex flex-wrap gap-4">
                {conference.start_date && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <Calendar className="w-5 h-5 text-white" />
                    <div>
                      <div className="text-xs text-red-200/80 font-semibold uppercase tracking-wide">Start Date</div>
                      <div className="font-bold text-white text-sm">
                        {new Date(conference.start_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {conference.location && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <MapPin className="w-5 h-5 text-white" />
                    <div>
                      <div className="text-xs text-red-200/80 font-semibold uppercase tracking-wide">Location</div>
                      <div className="font-bold text-white text-sm">
                        {conference.location}
                      </div>
                    </div>
                  </div>
                )}

                {conference.venue && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <Building2 className="w-5 h-5 text-white" />
                    <div>
                      <div className="text-xs text-red-200/80 font-semibold uppercase tracking-wide">Venue</div>
                      <div className="font-bold text-white text-sm">
                        {conference.venue}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Logo box */}
            {conference.logo_url && (
              <div className="flex justify-center md:justify-end">
                <div className="p-10 md:p-12 rounded-3xl bg-white shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={conference.logo_url}
                    alt={conference.name}
                    className="max-h-64 md:max-h-80 mx-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Registration and Abstract Forms - Modern Cards */}
      {(registrationEnabled || abstractSubmissionEnabled) && (
        <section className="relative py-24 bg-gradient-to-b from-white via-gray-50/50 to-white overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4">
                Get Started
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join us at the conference. Register now or submit your research abstract.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Registration Form Card */}
              {registrationEnabled && (
                <div className="relative bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl overflow-hidden">
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-6">
                      <div 
                        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
                        style={
                          conference.primary_color
                            ? {
                                background: `linear-gradient(135deg, ${conference.primary_color} 0%, ${conference.primary_color}DD 100%)`,
                              }
                            : {
                                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                              }
                        }
                      >
                        <Users className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 mb-3">
                        Register
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-6 text-base">
                        Secure your spot at the conference. Complete the registration form below and pay your attendance fee online.
                      </p>
                    </div>

                    {/* Benefits with icons */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          Secure online payment
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          Instant confirmation email
                        </span>
                      </div>
                      {pricing.early_bird && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            Early bird discounts available
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Registration Form */}
                    <div className="border-t-2 border-gray-100 pt-8">
                      <RegistrationForm conferenceId={conference.id} />
                    </div>
                  </div>
                </div>
              )}

              {/* Abstract Upload Form Card */}
              {abstractSubmissionEnabled && (
                <div className="relative bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl overflow-hidden">
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-6 shadow-xl">
                        <Upload className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 mb-3">
                        Submit Your Abstract
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-6 text-base">
                        Share your research with the scientific community. Upload your abstract or paper to be considered for presentation.
                      </p>
                    </div>

                    {/* Benefits with icons */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                        <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          Word format (.doc, .docx)
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          Quick upload process
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                        <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          Instant submission confirmation
                        </span>
                      </div>
                    </div>

                    {/* Abstract Upload Form */}
                    <div className="border-t-2 border-gray-100 pt-8">
                      <AbstractUploadForm conferenceId={conference.id} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Conference Info - Modern Cards */}
      <section className="relative py-24 bg-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-100/30 to-transparent rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Important Dates Card */}
            {(conference.start_date ||
              pricing.early_bird?.deadline ||
              pricing.regular) && (
              <div className="group relative p-10 rounded-3xl bg-gradient-to-br from-white via-blue-50/50 to-white border-2 border-blue-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900">
                      Important Dates
                    </h3>
                  </div>
                  <ul className="space-y-6">
                    {pricing.early_bird?.deadline && (
                      <li className="flex items-start gap-4 group/item">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 mb-2 text-lg">
                            Early Registration
                          </div>
                          <div className="text-gray-600 font-medium">
                            {new Date(
                              pricing.early_bird.deadline
                            ).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </li>
                    )}
                    {conference.start_date && (
                      <li className="flex items-start gap-4 group/item">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 mb-2 text-lg">
                            Conference Dates
                          </div>
                          <div className="text-gray-600 font-medium">
                            {new Date(
                              conference.start_date
                            ).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                            {conference.end_date &&
                              ` - ${new Date(
                                conference.end_date
                              ).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}`}
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Pricing Info Card */}
            {pricing && (
              <div className="group relative p-10 rounded-3xl bg-gradient-to-br from-white via-purple-50/50 to-white border-2 border-purple-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900">
                      Registration Fees
                    </h3>
                  </div>
                  <ul className="space-y-6">
                    {pricing.early_bird?.amount && (
                      <li className="flex items-start gap-4 group/item">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 mb-2 text-lg">
                            Early Bird
                          </div>
                          <div className="text-2xl font-black text-blue-600">
                            {pricing.currency} {pricing.early_bird.amount}
                          </div>
                        </div>
                      </li>
                    )}
                    {pricing.regular?.amount && (
                      <li className="flex items-start gap-4 group/item">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 mb-2 text-lg">
                            Regular
                          </div>
                          <div className="text-2xl font-black text-purple-600">
                            {pricing.currency} {pricing.regular.amount}
                          </div>
                        </div>
                      </li>
                    )}
                    {pricing.student_discount && (
                      <li className="flex items-start gap-4 group/item">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 mb-2 text-lg">
                            Student Discount
                          </div>
                          <div className="text-xl font-black text-violet-600">
                            {pricing.currency} {pricing.student_discount} off
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

