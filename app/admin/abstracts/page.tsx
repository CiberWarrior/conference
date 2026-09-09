'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import { showSuccess, showError } from '@/utils/toast'

// Force dynamic rendering for this page (uses searchParams)
export const dynamic = 'force-dynamic'
import {
  Download,
  FileText,
  Search,
  Filter,
  Calendar,
  Mail,
  User,
  X,
  ExternalLink,
  CheckCircle,
} from 'lucide-react'

interface Author {
  firstName?: string
  lastName?: string
  email?: string
  affiliation?: string
  country?: string
  city?: string
  orcid?: string
  isCorresponding?: boolean
  order?: number
  customFields?: Record<string, any>
}

interface Abstract {
  id: string
  file_name: string
  file_path: string
  file_size: number
  email: string | null
  uploaded_at: string
  conference_id: string | null
  registration_id: string | null
  custom_data: Record<string, any> | null
  authors?: Author[] | null
  status?: string
  conference?: {
    id: string
    name: string
    slug: string
  }
}

function AbstractsPageContent() {
  const searchParams = useSearchParams()
  const t = useTranslations('admin.abstracts')
  const c = useTranslations('admin.common')
  const locale = useLocale()
  const { currentConference, conferences, setCurrentConference, loading: conferenceLoading } =
    useConference()
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConferenceId, setSelectedConferenceId] = useState<
    string | 'all'
  >('all')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [reviewers, setReviewers] = useState<Array<{ id: string; email: string; name?: string }>>([])
  const [exportingBook, setExportingBook] = useState(false)

  const loadReviewers = async () => {
    if (!currentConference?.id) {
      setReviewers([])
      return
    }
    try {
      const res = await fetch(
        `/api/admin/abstracts/reviews?conferenceId=${currentConference.id}`
      )
      const data = await res.json()
      if (res.ok) setReviewers(data.reviewers || [])
    } catch {
      // ignore
    }
  }

  // Handle conference query parameter - set conference from URL if provided
  useEffect(() => {
    const conferenceId = searchParams?.get('conference')
    if (conferenceId && conferences.length > 0) {
      const conference = conferences.find((c) => c.id === conferenceId)
      if (conference && conference.id !== currentConference?.id) {
        setCurrentConference(conference)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conferences])

  useEffect(() => {
    loadAbstracts()
    loadReviewers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConference, selectedConferenceId])

  // Auto-select current conference if available
  useEffect(() => {
    if (currentConference && selectedConferenceId === 'all') {
      setSelectedConferenceId(currentConference.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConference])

  const loadAbstracts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('abstracts')
        .select('*, conferences(id, name, slug)')
        .order('uploaded_at', { ascending: false })

      // Filter by conference if selected
      if (selectedConferenceId !== 'all') {
        query = query.eq('conference_id', selectedConferenceId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setAbstracts(
        (data || []).map((a: any) => {
          // Parse authors if stored as string (JSONB from Supabase is usually already parsed)
          let authors: Author[] | null = null
          if (a.authors != null) {
            if (Array.isArray(a.authors)) authors = a.authors
            else if (typeof a.authors === 'string') {
              try {
                const parsed = JSON.parse(a.authors)
                authors = Array.isArray(parsed) ? parsed : null
              } catch {
                authors = null
              }
            }
          }
          return {
            id: a.id,
            file_name: a.file_name,
            file_path: a.file_path,
            file_size: a.file_size,
            email: a.email,
            uploaded_at: a.uploaded_at,
            conference_id: a.conference_id,
            registration_id: a.registration_id,
            custom_data: a.custom_data || {},
            authors: authors ?? undefined,
            status: a.status || 'pending',
            conference: a.conferences
              ? {
                  id: a.conferences.id,
                  name: a.conferences.name,
                  slug: a.conferences.slug,
                }
              : undefined,
          }
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadFailed'))
      showError(t('loadFailedToast'))
    } finally {
      setLoading(false)
    }
  }

  const downloadAbstract = async (abstract: Abstract) => {
    try {
      setDownloadingId(abstract.id)

      // Get signed URL for download
      const { data, error: urlError } = await supabase.storage
        .from('abstracts')
        .createSignedUrl(abstract.file_path, 3600) // 1 hour expiry

      if (urlError) throw urlError

      if (data?.signedUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = abstract.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showSuccess(t('downloadSuccess'))
      } else {
        throw new Error(t('downloadUrlFailed'))
      }
    } catch (err) {
      console.error('Download error:', err)
      showError(
        t('downloadFailed') +
          ': ' +
          (err instanceof Error ? err.message : t('unknownError'))
      )
    } finally {
      setDownloadingId(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const updateStatus = async (
    abstract: Abstract,
    status: 'accepted' | 'rejected' | 'under_review' | 'pending' | 'withdrawn'
  ) => {
    if (!abstract.conference_id) {
      showError(t('missingConference'))
      return
    }
    setUpdatingId(abstract.id)
    try {
      const res = await fetch('/api/admin/abstracts/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abstractId: abstract.id,
          conferenceId: abstract.conference_id,
          status,
          notify: status === 'accepted' || status === 'rejected',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setAbstracts((prev) =>
        prev.map((a) => (a.id === abstract.id ? { ...a, status } : a))
      )
      showSuccess(t('statusUpdated', { status }))
    } catch (e: any) {
      showError(e.message || t('updateFailed'))
    } finally {
      setUpdatingId(null)
    }
  }

  const inviteReviewer = async () => {
    if (!currentConference?.id || !reviewerEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/admin/abstracts/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceId: currentConference.id,
          action: 'invite_reviewer',
          email: reviewerEmail.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invite failed')
      showSuccess(
        data.reviewUrl
          ? t('reviewerInvitedWithLink', { url: data.reviewUrl })
          : t('reviewerInvited')
      )
      setReviewerEmail('')
      loadReviewers()
    } catch (e: any) {
      showError(e.message || 'Invite failed')
    } finally {
      setInviting(false)
    }
  }

  const assignReviewer = async (abstract: Abstract, reviewerId: string) => {
    if (!abstract.conference_id || !reviewerId) return
    try {
      const res = await fetch('/api/admin/abstracts/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceId: abstract.conference_id,
          action: 'assign',
          abstractId: abstract.id,
          reviewerId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Assign failed')
      setAbstracts((prev) =>
        prev.map((a) =>
          a.id === abstract.id ? { ...a, status: 'under_review' } : a
        )
      )
      showSuccess(t('assignedReviewer'))
    } catch (e: any) {
      showError(e.message || t('assignFailed'))
    }
  }

  const exportBook = async () => {
    if (!currentConference?.id) return
    const acceptedCount = abstracts.filter((a) => a.status === 'accepted').length
    if (acceptedCount === 0) {
      showError(t('noAcceptedForBook'))
      return
    }
    setExportingBook(true)
    try {
      const res = await fetch('/api/admin/abstracts/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conferenceId: currentConference.id, status: 'accepted' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t('bookExportFailed'))
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `book-of-abstracts-${currentConference.slug}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess(t('bookExported'))
    } catch (e: any) {
      showError(e.message || t('bookExportFailed'))
    } finally {
      setExportingBook(false)
    }
  }

  // Filter abstracts based on search
  const filteredAbstracts = abstracts.filter((abstract) => {
    if (statusFilter !== 'all' && (abstract.status || 'pending') !== statusFilter) {
      return false
    }
    const searchLower = searchTerm.toLowerCase()
    return (
      abstract.file_name.toLowerCase().includes(searchLower) ||
      (abstract.email && abstract.email.toLowerCase().includes(searchLower)) ||
      (abstract.conference &&
        abstract.conference.name.toLowerCase().includes(searchLower)) ||
      (abstract.custom_data &&
        JSON.stringify(abstract.custom_data)
          .toLowerCase()
          .includes(searchLower))
    )
  })

  if (loading && abstracts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={exportBook}
          disabled={exportingBook || !currentConference}
          className="px-4 py-2 bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 shrink-0"
        >
          {exportingBook ? t('exportingBook') : t('exportBook')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={t('clearSearch')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Conference Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <select
              value={selectedConferenceId}
              onChange={(e) => setSelectedConferenceId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer outline-none"
            >
              <option value="all">{t('allConferences')}</option>
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">{t('statusAll')}</option>
            <option value="pending">{t('statusPending')}</option>
            <option value="under_review">{t('statusUnderReview')}</option>
            <option value="accepted">{t('statusAccepted')}</option>
            <option value="rejected">{t('statusRejected')}</option>
            <option value="withdrawn">{t('statusWithdrawn')}</option>
          </select>
          <div className="flex flex-1 gap-2">
            <input
              type="email"
              value={reviewerEmail}
              onChange={(e) => setReviewerEmail(e.target.value)}
              placeholder={t('inviteReviewerEmail')}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={inviteReviewer}
              disabled={inviting || !currentConference}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {inviting ? t('inviting') : t('inviteReviewer')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">{t('totalAbstracts')}</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {abstracts.length}
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">{t('filteredResults')}</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {filteredAbstracts.length}
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Filter className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">{t('currentConference')}</p>
              <p className="text-lg font-semibold text-green-900 mt-2 line-clamp-1">
                {currentConference?.name || t('noneSelected')}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Abstracts List */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {filteredAbstracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('noAbstracts')}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || selectedConferenceId !== 'all'
              ? t('noResultsFilter')
              : t('noAbstracts')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading && (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Refreshing abstracts...</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('fileName')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('authors')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('conference')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('email')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('size')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('uploaded')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAbstracts.map((abstract) => (
                  <tr
                    key={abstract.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          {/* Title (if exists) */}
                          {abstract.custom_data?.abstractTitle && (
                            <div className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                              {abstract.custom_data.abstractTitle}
                            </div>
                          )}
                          
                          {/* File name */}
                          <div className="text-sm text-gray-600 truncate mb-1">
                            📎 {abstract.file_name}
                          </div>
                          
                          {/* Type badge */}
                          {abstract.custom_data?.abstractType && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              abstract.custom_data.abstractType === 'oral'
                                ? 'bg-blue-100 text-blue-700'
                                : abstract.custom_data.abstractType === 'invited'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {abstract.custom_data.abstractType === 'oral' && '🎤 Oral'}
                              {abstract.custom_data.abstractType === 'invited' && '⭐ Invited Speaker'}
                              {abstract.custom_data.abstractType === 'poster' && '📊 Poster'}
                            </span>
                          )}
                          
                          {/* Keywords */}
                          {abstract.custom_data?.abstractKeywords && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              🔑 {abstract.custom_data.abstractKeywords}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {abstract.authors && abstract.authors.length > 0 ? (
                        <div className="space-y-1">
                          {abstract.authors.slice(0, 2).map((author, idx) => (
                            <div key={idx} className="flex items-start text-sm">
                              <User className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 truncate">
                                  {author.firstName} {author.lastName}
                                  {author.isCorresponding && (
                                    <span className="ml-1 text-xs text-blue-600">★</span>
                                  )}
                                </div>
                                {author.affiliation && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {author.affiliation}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {abstract.authors.length > 2 && (
                            <div className="text-xs text-gray-500 ml-5">
                              +{abstract.authors.length - 2} više
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {abstract.conference?.slug ? (
                        <Link
                          href={`/conferences/${abstract.conference.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{abstract.conference.name}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <div className="text-sm text-gray-900">
                          <span className="text-gray-400 italic">N/A</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {abstract.email || (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </span>
                        </div>
                        {abstract.registration_id && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Povezano sa registracijom
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {formatFileSize(abstract.file_size)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(abstract.uploaded_at).toLocaleDateString(
                        locale === 'hr' ? 'hr-HR' : 'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            abstract.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : abstract.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : abstract.status === 'under_review'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {abstract.status || 'pending'}
                        </span>
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            disabled={updatingId === abstract.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateStatus(abstract, 'accepted')
                            }}
                            className="px-2 py-1 text-xs rounded bg-emerald-600 text-white disabled:opacity-50"
                          >
                            {t('accept')}
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === abstract.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateStatus(abstract, 'rejected')
                            }}
                            className="px-2 py-1 text-xs rounded bg-red-600 text-white disabled:opacity-50"
                          >
                            {t('reject')}
                          </button>
                          {reviewers.length > 0 && (
                            <select
                              className="text-xs border rounded px-1 py-1 max-w-[140px]"
                              defaultValue=""
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignReviewer(abstract, e.target.value)
                                  e.target.value = ''
                                }
                              }}
                            >
                              <option value="">{t('assignReviewer')}</option>
                              {reviewers.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name || r.email}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadAbstract(abstract)
                            }}
                            disabled={downloadingId === abstract.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingId === abstract.id ? '…' : t('download')}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrapper with Suspense boundary
export default function AbstractsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AbstractsPageContent />
    </Suspense>
  )
}
