'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import RegistrationForm from '@/components/RegistrationForm'
import { ArrowLeft, Users, CheckCircle } from 'lucide-react'
import type { Conference } from '@/types/conference'
import { DEFAULT_PAYMENT_SETTINGS } from '@/constants/defaultPaymentSettings'

export default function ConferenceRegisterPage() {
  const t = useTranslations('register')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const params = useParams()
  const slug = params?.slug as string
  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasBankAccount, setHasBankAccount] = useState(false)
  const [feeTypeUsage, setFeeTypeUsage] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!slug) return

    const loadConference = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/conferences/${slug}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || t('notFound'))
          return
        }

        const conf = data.conference
        setConference(conf)

        // Check if registration is enabled
        const settings = conf.settings || {}
        if (settings.registration_enabled === false) {
          setError(t('notAvailable'))
          return
        }

        // Set bank account status from API response
        setHasBankAccount(data.organizer_has_bank_account || false)
      } catch (err) {
        setError(t('loadFailed'))
        console.error('Error loading conference:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConference()
  }, [slug, t])

  useEffect(() => {
    if (!slug) return
    const loadFeeTypeUsage = async () => {
      try {
        const res = await fetch(`/api/conferences/${slug}/fee-type-usage`)
        const data = await res.json()
        if (res.ok && data.usage) setFeeTypeUsage(data.usage)
      } catch {
        // ignore
      }
    }
    loadFeeTypeUsage()
  }, [slug])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !conference) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error || t('notFound')}
            </h1>
            <Link
              href={slug ? `/conferences/${slug}` : '/'}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {tCommon('back')}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/conferences/${slug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToConference')}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('title', { name: conference.name })}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('description')}
            </p>
          </div>

          {/* Conference Info */}
          {(conference.start_date || conference.location) && (
            <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {conference.start_date && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">{tCommon('date')}</div>
                      <div className="text-gray-600">
                        {new Date(
                          conference.start_date
                        ).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {conference.end_date &&
                          ` - ${new Date(
                            conference.end_date
                          ).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}`}
                      </div>
                    </div>
                  </div>
                )}
                {conference.location && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">{tCommon('location')}</div>
                      <div className="text-gray-600">
                        {conference.location}
                        {conference.venue && `, ${conference.venue}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                {t('securePayment')}
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                {t('instantConfirmation')}
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                {t('earlyBirdAvailable')}
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <RegistrationForm 
              conferenceId={conference.id}
              conferenceSlug={conference.slug}
              customFields={conference.settings?.custom_registration_fields || []}
              participantSettings={conference.settings?.participant_settings}
              registrationInfoText={conference.settings?.registration_info_text}
              pricing={conference.pricing}
              hotelOptions={conference.settings?.hotel_options || []}
              currency={conference.pricing?.currency || 'EUR'}
              conferenceStartDate={conference.start_date}
              conferenceEndDate={conference.end_date}
              abstractSubmissionEnabled={conference.settings?.abstract_submission_enabled}
              paymentSettings={conference.settings?.payment_settings || DEFAULT_PAYMENT_SETTINGS}
              hasBankAccount={hasBankAccount}
              conferenceName={conference.name}
              conferenceDate={conference.start_date ? new Date(conference.start_date).toLocaleDateString() : undefined}
              conferenceLocation={conference.location || conference.venue}
              feeTypeUsage={feeTypeUsage}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

