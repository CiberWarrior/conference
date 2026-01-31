'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { showSuccess, showError, showWarning } from '@/utils/toast'

interface Certificate {
  id: string
  registration_id: string
  certificate_type: string
  certificate_number: string
  issued_date: string
  created_at: string
  registration?: {
    first_name: string
    last_name: string
    email: string
    certificate_generated: boolean
    certificate_sent: boolean
    conference_id: string
  }
}

export default function CertificatesPage() {
  const t = useTranslations('admin.certificates')
  const tDashboard = useTranslations('admin.dashboard')
  const c = useTranslations('admin.common')
  const { currentConference, loading: conferenceLoading } = useConference()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const [conferenceName, setConferenceName] = useState('International Conference')
  const [conferenceDate, setConferenceDate] = useState('')
  const [conferenceLocation, setConferenceLocation] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [certificateType, setCertificateType] = useState<'participation' | 'presentation' | 'organizer' | 'volunteer'>('participation')

  useEffect(() => {
    if (currentConference) {
      // Set conference details
      setConferenceName(currentConference.name)
      if (currentConference.start_date) {
        setConferenceDate(new Date(currentConference.start_date).toLocaleDateString())
      }
      if (currentConference.location) {
        setConferenceLocation(currentConference.location)
      }
      if (currentConference.logo_url) {
        setLogoUrl(currentConference.logo_url)
      }
      
      loadCertificates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConference])

  const loadCertificates = async () => {
    if (!currentConference) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // First, get all registrations for this conference
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('id')
        .eq('conference_id', currentConference.id)
      
      if (regError) throw regError
      
      const registrationIds = registrations?.map(r => r.id) || []
      
      if (registrationIds.length === 0) {
        setCertificates([])
        setLoading(false)
        return
      }

      // Then get certificates for those registrations
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          registrations (
            first_name,
            last_name,
            email,
            certificate_generated,
            certificate_sent,
            conference_id
          )
        `)
        .in('registration_id', registrationIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCertificates(
        (data || []).map((cert: any) => ({
          ...cert,
          registration: cert.registrations,
        }))
      )
    } catch (error) {
      console.error('Failed to load certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCertificate = async (registrationId: string) => {
    if (!currentConference) {
      showWarning(t('selectConferenceFirst'))
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          conferenceId: currentConference.id,
          certificateType,
          conferenceName,
          conferenceDate,
          conferenceLocation,
          logoUrl: logoUrl || undefined,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate-${registrationId.substring(0, 8)}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        showSuccess(t('certificateGeneratedSuccess'))
        loadCertificates()
      } else {
        const data = await response.json()
        showError(t('errorPrefix') + data.error)
      }
    } catch (error) {
      showError(t('errorGeneratingCertificate'))
    } finally {
      setProcessing(false)
    }
  }

  const generateBulkCertificates = async () => {
    if (selectedIds.size === 0) {
      showWarning(t('selectRegistrations'))
      return
    }

    if (!currentConference) {
      showWarning(t('selectConferenceFirst'))
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/certificates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationIds: Array.from(selectedIds),
          conferenceId: currentConference.id,
          certificateType,
          conferenceName,
          conferenceDate,
          conferenceLocation,
          logoUrl: logoUrl || undefined,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        showSuccess(data.message)
        setSelectedIds(new Set())
        loadCertificates()
      } else {
        showError(t('errorPrefix') + data.error)
      }
    } catch (error) {
      showError(t('errorGeneratingCertificates'))
    } finally {
      setProcessing(false)
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === certificates.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(certificates.map((c) => c.registration_id)))
    }
  }

  if (!currentConference && !conferenceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{tDashboard('noConferenceSelected')}</h2>
          <p className="text-gray-600 mb-6">
            {t('selectConferenceHint')}
          </p>
          <Link
            href="/admin/conferences"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            {t('goToMyConferences')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-2 text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('certificateSettings')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('conferenceName')}
            </label>
            <input
              type="text"
              value={conferenceName}
              onChange={(e) => setConferenceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('certificateType')}
            </label>
            <select
              value={certificateType}
              onChange={(e) =>
                setCertificateType(
                  e.target.value as 'participation' | 'presentation' | 'organizer' | 'volunteer'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="participation">{t('participation')}</option>
              <option value="presentation">{t('presentation')}</option>
              <option value="organizer">{t('organizer')}</option>
              <option value="volunteer">{t('volunteer')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('conferenceDate')}
            </label>
            <input
              type="text"
              value={conferenceDate}
              onChange={(e) => setConferenceDate(e.target.value)}
              placeholder={t('conferenceDatePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('conferenceLocation')}
            </label>
            <input
              type="text"
              value={conferenceLocation}
              onChange={(e) => setConferenceLocation(e.target.value)}
              placeholder={t('conferenceLocationPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('logoUrlOptional')}
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder={t('logoUrlPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('logoUrlHint')}
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 mb-6 flex items-center justify-between rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {t('selectedCount', { count: selectedIds.size })}
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {t('clearSelection')}
            </button>
          </div>
          <button
            onClick={generateBulkCertificates}
            disabled={processing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {processing ? t('generating') : t('generateCertificates')}
          </button>
        </div>
      )}

      {/* Certificates List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('certificatesList')}</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t('noCertificatesFound')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === certificates.length && certificates.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('email')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('type')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('certificateNumber')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('issued')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map((cert) => (
                  <tr key={cert.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(cert.registration_id)}
                        onChange={() => toggleSelect(cert.registration_id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert.registration
                        ? `${cert.registration.first_name} ${cert.registration.last_name}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert.registration?.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {cert.certificate_type === 'participation'
                          ? t('participation')
                          : cert.certificate_type === 'presentation'
                            ? t('presentation')
                            : cert.certificate_type === 'organizer'
                              ? t('organizer')
                              : cert.certificate_type === 'volunteer'
                                ? t('volunteer')
                                : cert.certificate_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cert.certificate_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cert.issued_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => generateCertificate(cert.registration_id)}
                        disabled={processing}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        {t('download')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

