'use client'

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import { showSuccess, showError } from '@/utils/toast'
import StatusBadge from '@/components/admin/StatusBadge'
import AbstractDetailDrawer, {
  ABSTRACT_STATUS_LABEL_KEY,
  ABSTRACT_STATUS_TONE,
  type AbstractRecord,
} from '@/components/admin/AbstractDetailDrawer'
import {
  formatAuthorList,
  getAbstractContent,
  getAbstractKeywords,
  getAbstractTitle,
  getAbstractType,
  getCorrespondingAuthorEmail,
  groupReviewsByAbstract,
  isDocumentUploadAbstract,
  summarizeReviews,
  type AbstractStatus,
  type ReviewLike,
} from '@/lib/abstract-display'

// Force dynamic rendering for this page (uses searchParams)
export const dynamic = 'force-dynamic'
import {
  Download,
  FileText,
  Search,
  Filter,
  Mail,
  User,
  X,
  ExternalLink,
  CheckCircle,
  ClipboardList,
  Clock,
  BellRing,
  FileSpreadsheet,
} from 'lucide-react'

interface Abstract extends AbstractRecord {
  conference?: {
    id: string
    name: string
    slug: string
  }
}

function parseAuthors(raw: unknown): Abstract['authors'] {
  if (Array.isArray(raw)) return raw as Abstract['authors']
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

function AbstractsPageContent() {
  const searchParams = useSearchParams()
  const t = useTranslations('admin.abstracts')
  const locale = useLocale()
  const { currentConference, conferences, setCurrentConference } = useConference()
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [reviews, setReviews] = useState<ReviewLike[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConferenceId, setSelectedConferenceId] = useState<string | 'all'>('all')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [savingStatus, setSavingStatus] = useState(false)
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [reviewers, setReviewers] = useState<
    Array<{ id: string; email: string; name?: string | null }>
  >([])
  const [exportingBook, setExportingBook] = useState<'pdf' | 'docx' | null>(null)
  const [reminding, setReminding] = useState(false)
  const [detailAbstract, setDetailAbstract] = useState<Abstract | null>(null)

  const reviewConferenceId =
    selectedConferenceId !== 'all' ? selectedConferenceId : currentConference?.id

  const loadAbstracts = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('abstracts')
        .select('*, conferences(id, name, slug)')
        .order('uploaded_at', { ascending: false })

      if (selectedConferenceId !== 'all') {
        query = query.eq('conference_id', selectedConferenceId)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      setAbstracts(
        (data || []).map((a: any) => ({
          id: a.id,
          file_name: a.file_name,
          file_path: a.file_path,
          file_size: a.file_size,
          email: a.email,
          uploaded_at: a.uploaded_at,
          conference_id: a.conference_id,
          registration_id: a.registration_id,
          title: a.title,
          custom_data: a.custom_data || {},
          authors: parseAuthors(a.authors),
          status: a.status || 'pending',
          decision_notes: a.decision_notes,
          decided_at: a.decided_at,
          conference: a.conferences
            ? {
                id: a.conferences.id,
                name: a.conferences.name,
                slug: a.conferences.slug,
              }
            : undefined,
        }))
      )
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadFailed'))
      showError(t('loadFailedToast'))
    } finally {
      setLoading(false)
    }
  }, [selectedConferenceId, t])

  const loadReviews = useCallback(async () => {
    if (!reviewConferenceId) {
      setReviewers([])
      setReviews([])
      return
    }
    try {
      const res = await fetch(
        `/api/admin/abstracts/reviews?conferenceId=${reviewConferenceId}`
      )
      const data = await res.json()
      if (res.ok) {
        setReviewers(data.reviewers || [])
        setReviews(data.reviews || [])
      }
    } catch {
      // non-blocking
    }
  }, [reviewConferenceId])

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
  }, [loadAbstracts])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  // Auto-select current conference if available
  useEffect(() => {
    if (currentConference && selectedConferenceId === 'all') {
      setSelectedConferenceId(currentConference.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConference])

  const reviewsByAbstract = useMemo(() => groupReviewsByAbstract(reviews), [reviews])

  const downloadAbstract = async (abstract: AbstractRecord) => {
    try {
      setDownloadingId(abstract.id)
      if (!abstract.file_path) throw new Error(t('downloadUrlFailed'))

      // Signed URL is issued server-side only after the admin's conference
      // permission has been verified (bucket has no client-side read policy).
      const response = await fetch(`/api/admin/abstracts/${abstract.id}/download`, {
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok || !data?.url) {
        throw new Error(data?.error?.message || data?.error || t('downloadUrlFailed'))
      }

      const link = document.createElement('a')
      link.href = data.url
      link.download = abstract.file_name || 'abstract'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccess(t('downloadSuccess'))
    } catch (err) {
      showError(
        `${t('downloadFailed')}: ${err instanceof Error ? err.message : t('unknownError')}`
      )
    } finally {
      setDownloadingId(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`
  }

  const patchStatus = async (
    abstract: AbstractRecord,
    status: AbstractStatus,
    options: { decisionNotes?: string; notify?: boolean } = {}
  ) => {
    if (!abstract.conference_id) {
      showError(t('missingConference'))
      return
    }
    setSavingStatus(true)
    try {
      const res = await fetch('/api/admin/abstracts/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abstractId: abstract.id,
          conferenceId: abstract.conference_id,
          status,
          decisionNotes: options.decisionNotes,
          notify: options.notify ?? false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('updateFailed'))

      const patch = {
        status,
        decision_notes: options.decisionNotes ?? abstract.decision_notes ?? null,
      }
      setAbstracts((prev) =>
        prev.map((a) => (a.id === abstract.id ? { ...a, ...patch } : a))
      )
      setDetailAbstract((prev) => (prev?.id === abstract.id ? { ...prev, ...patch } : prev))
      showSuccess(
        data.notified
          ? t('statusUpdatedNotified', { status: t(ABSTRACT_STATUS_LABEL_KEY[status]) })
          : t('statusUpdated', { status: t(ABSTRACT_STATUS_LABEL_KEY[status]) })
      )
    } catch (e: any) {
      showError(e.message || t('updateFailed'))
    } finally {
      setSavingStatus(false)
    }
  }

  const saveDecisionNotes = async (abstract: AbstractRecord, decisionNotes: string) => {
    await patchStatus(abstract, (abstract.status || 'pending') as AbstractStatus, {
      decisionNotes,
      notify: false,
    })
  }

  const inviteReviewer = async () => {
    if (!reviewConferenceId || !reviewerEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/admin/abstracts/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceId: reviewConferenceId,
          action: 'invite_reviewer',
          email: reviewerEmail.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('inviteFailed'))
      showSuccess(
        data.reviewUrl
          ? t('reviewerInvitedWithLink', { url: data.reviewUrl })
          : t('reviewerInvited')
      )
      setReviewerEmail('')
      loadReviews()
    } catch (e: any) {
      showError(e.message || t('inviteFailed'))
    } finally {
      setInviting(false)
    }
  }

  const assignReviewer = async (abstract: AbstractRecord, reviewerId: string) => {
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
      if (!res.ok) throw new Error(data.error || t('assignFailed'))

      if ((abstract.status || 'pending') === 'pending') {
        setAbstracts((prev) =>
          prev.map((a) => (a.id === abstract.id ? { ...a, status: 'under_review' } : a))
        )
        setDetailAbstract((prev) =>
          prev?.id === abstract.id ? { ...prev, status: 'under_review' } : prev
        )
      }
      await loadReviews()
      showSuccess(t('assignedReviewer'))
    } catch (e: any) {
      showError(e.message || t('assignFailed'))
    }
  }

  const unassignReviewer = async (abstract: AbstractRecord, reviewId: string) => {
    if (!abstract.conference_id) return
    try {
      const res = await fetch('/api/admin/abstracts/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceId: abstract.conference_id,
          action: 'unassign',
          reviewId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('unassignFailed'))
      await Promise.all([loadReviews(), loadAbstracts()])
      showSuccess(t('reviewerRemoved'))
    } catch (e: any) {
      showError(e.message || t('unassignFailed'))
    }
  }

  const remindReviewers = async (reviewerId?: string) => {
    if (!reviewConferenceId) return
    setReminding(true)
    try {
      const res = await fetch('/api/admin/abstracts/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceId: reviewConferenceId,
          action: 'remind',
          reviewerId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('remindFailed'))
      if (data.reminded === 0) {
        showSuccess(t('noPendingReviews'))
      } else {
        showSuccess(t('remindersSent', { count: data.reminded }))
      }
      loadReviews()
    } catch (e: any) {
      showError(e.message || t('remindFailed'))
    } finally {
      setReminding(false)
    }
  }

  const exportBook = async (format: 'pdf' | 'docx') => {
    if (!reviewConferenceId) return

    // Final book = accepted only. With a status filter, export that slice (e.g. draft preview).
    const bookStatus = statusFilter !== 'all' ? statusFilter : 'accepted'
    const exportCount = abstracts.filter(
      (a) => (a.status || 'pending') === bookStatus
    ).length

    if (exportCount === 0) {
      showError(
        bookStatus === 'accepted' ? t('noAcceptedForBookHint') : t('noAbstractsForBookFilter')
      )
      return
    }

    setExportingBook(format)
    try {
      const res = await fetch('/api/admin/abstracts/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceId: reviewConferenceId,
          status: bookStatus,
          format,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t('bookExportFailed'))
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `book-of-abstracts-${currentConference?.slug || 'conference'}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess(t('bookExported'))
    } catch (e: any) {
      showError(e.message || t('bookExportFailed'))
    } finally {
      setExportingBook(null)
    }
  }

  // Filter abstracts based on status + search
  const filteredAbstracts = abstracts.filter((abstract) => {
    if (statusFilter !== 'all' && (abstract.status || 'pending') !== statusFilter) {
      return false
    }
    if (!searchTerm.trim()) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      getAbstractTitle(abstract).toLowerCase().includes(searchLower) ||
      (abstract.file_name?.toLowerCase().includes(searchLower) ?? false) ||
      (abstract.email?.toLowerCase().includes(searchLower) ?? false) ||
      formatAuthorList(abstract.authors).toLowerCase().includes(searchLower) ||
      (abstract.conference?.name.toLowerCase().includes(searchLower) ?? false) ||
      JSON.stringify(abstract.custom_data || {})
        .toLowerCase()
        .includes(searchLower)
    )
  })

  const exportToExcel = () => {
    if (filteredAbstracts.length === 0) {
      showError(t('noResultsFilter'))
      return
    }

    const rows = filteredAbstracts.map((abstract, index) => {
      const abstractReviews = reviewsByAbstract[abstract.id] || []
      const summary = summarizeReviews(abstractReviews)
      return {
        [t('exportIndex')]: index + 1,
        [t('exportTitle')]: getAbstractTitle(abstract),
        [t('statusLabel')]: t(
          ABSTRACT_STATUS_LABEL_KEY[(abstract.status || 'pending') as AbstractStatus]
        ),
        [t('exportType')]: getAbstractType(abstract) || '',
        [t('authors')]: formatAuthorList(abstract.authors, { withAffiliation: true }),
        [t('exportCorrespondingEmail')]:
          getCorrespondingAuthorEmail(abstract.authors) || '',
        [t('email')]: abstract.email || '',
        [t('keywords')]: getAbstractKeywords(abstract) || '',
        [t('exportReviewsSubmitted')]: `${summary.submitted}/${summary.total}`,
        [t('averageScore')]: summary.averageScore ?? '',
        [t('exportRecommendations')]: `${t('recAccept')}: ${summary.accept}, ${t(
          'recRevise'
        )}: ${summary.revise}, ${t('recReject')}: ${summary.reject}`,
        [t('decisionNotes')]: abstract.decision_notes || '',
        [t('fileName')]: abstract.file_name,
        [t('uploaded')]: new Date(abstract.uploaded_at).toLocaleString(
          locale === 'hr' ? 'hr-HR' : 'en-US'
        ),
        [t('exportAbstractText')]: getAbstractContent(abstract) || '',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    worksheet['!cols'] = Object.keys(rows[0] || {}).map((key) => ({
      wch: key === t('exportAbstractText') ? 60 : Math.min(Math.max(key.length + 4, 14), 40),
    }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Abstracts')
    XLSX.writeFile(
      workbook,
      `abstracts-${currentConference?.slug || 'all'}-${new Date().toISOString().slice(0, 10)}.xlsx`
    )
    showSuccess(t('exportSuccess'))
  }

  const stats = useMemo(() => {
    const byStatus = abstracts.reduce<Record<string, number>>((acc, a) => {
      const key = a.status || 'pending'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return {
      total: abstracts.length,
      awaiting: (byStatus.pending || 0) + (byStatus.under_review || 0),
      accepted: byStatus.accepted || 0,
      pendingReviews: reviews.filter((r) => !r.submitted_at).length,
    }
  }, [abstracts, reviews])

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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportToExcel}
            disabled={filteredAbstracts.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t('exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => remindReviewers()}
            disabled={reminding || !reviewConferenceId || stats.pendingReviews === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <BellRing className="w-4 h-4" />
            {reminding ? t('sendingReminders') : t('remindAllReviewers')}
          </button>
          <div className="inline-flex items-stretch rounded-lg overflow-hidden border border-indigo-700">
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-700 text-white text-sm font-medium">
              <FileText className="w-4 h-4" />
              {t('exportBook')}
            </span>
            <button
              type="button"
              onClick={() => exportBook('pdf')}
              disabled={Boolean(exportingBook) || !reviewConferenceId}
              className="px-3 py-2 bg-white text-indigo-700 text-sm font-semibold border-l border-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
            >
              {exportingBook === 'pdf' ? t('exportingBook') : t('formatPdf')}
            </button>
            <button
              type="button"
              onClick={() => exportBook('docx')}
              disabled={Boolean(exportingBook) || !reviewConferenceId}
              className="px-3 py-2 bg-white text-indigo-700 text-sm font-semibold border-l border-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
            >
              {exportingBook === 'docx' ? t('exportingBook') : t('formatWord')}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <p className="text-sm font-semibold text-slate-800 mb-2">{t('workflowTitle')}</p>
        <ol className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4 text-xs sm:text-sm text-slate-600">
          <li>{t('workflowStep1')}</li>
          <li>{t('workflowStep2')}</li>
          <li>{t('workflowStep3')}</li>
          <li>{t('workflowStep4')}</li>
        </ol>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={t('clearSearch')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <select
              value={selectedConferenceId}
              onChange={(e) => setSelectedConferenceId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer outline-none"
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

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white sm:w-52"
          >
            <option value="all">{t('statusAll')}</option>
            <option value="pending">{t('statusPending')}</option>
            <option value="under_review">{t('statusUnderReview')}</option>
            <option value="revise">{t('statusRevise')}</option>
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
              disabled={inviting || !reviewConferenceId}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 shrink-0"
            >
              {inviting ? t('inviting') : t('inviteReviewer')}
            </button>
          </div>
        </div>

        {reviewers.length > 0 && (
          <p className="text-xs text-gray-500">
            {t('reviewersConfigured', { count: reviewers.length })}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">{t('totalAbstracts')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">{t('awaitingDecision')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.awaiting}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">{t('statusAccepted')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">{t('reviewsOutstanding')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <X className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Abstracts List */}
      {filteredAbstracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 sm:p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noAbstracts')}</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? t('noResultsFilter')
              : t('noAbstracts')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('abstract')}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('authors')}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('statusLabel')}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('reviewsColumn')}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('email')}
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAbstracts.map((abstract) => {
                  const status = (abstract.status || 'pending') as AbstractStatus
                  const abstractReviews = reviewsByAbstract[abstract.id] || []
                  const summary = summarizeReviews(abstractReviews)
                  const type = getAbstractType(abstract)

                  return (
                    <tr key={abstract.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 max-w-xs">
                        <button
                          type="button"
                          onClick={() => setDetailAbstract(abstract)}
                          className="text-left w-full group"
                        >
                          <span className="block text-sm font-semibold text-gray-900 group-hover:text-blue-700 line-clamp-2">
                            {getAbstractTitle(abstract, t('untitled'))}
                          </span>
                          <span className="block text-xs text-gray-500 truncate mt-0.5">
                            {abstract.file_name && abstract.file_size
                              ? `${abstract.file_name} · ${formatFileSize(abstract.file_size)}`
                              : abstract.email || t('formSubmission')}
                          </span>
                        </button>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <StatusBadge
                            tone={isDocumentUploadAbstract(abstract) ? 'violet' : 'neutral'}
                          >
                            {isDocumentUploadAbstract(abstract)
                              ? t('methodDocument')
                              : t('methodOnlineForm')}
                          </StatusBadge>
                          {type && (
                            <StatusBadge tone="info" className="capitalize">
                              {type}
                            </StatusBadge>
                          )}
                          {abstract.conference?.slug && selectedConferenceId === 'all' && (
                            <Link
                              href={`/conferences/${abstract.conference.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              {abstract.conference.name}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-[200px]">
                        {abstract.authors?.length ? (
                          <div className="text-sm text-gray-900">
                            <div className="flex items-start gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">
                                {formatAuthorList(abstract.authors)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge tone={ABSTRACT_STATUS_TONE[status]}>
                          {t(ABSTRACT_STATUS_LABEL_KEY[status])}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {summary.total === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-gray-900 font-medium">
                              {summary.submitted}/{summary.total}
                              {summary.averageScore != null && (
                                <span className="ml-1.5 text-gray-500 font-normal">
                                  ø {summary.averageScore}
                                </span>
                              )}
                            </p>
                            {summary.submitted > 0 && (
                              <p className="text-xs text-gray-500">
                                +{summary.accept} / ~{summary.revise} / −{summary.reject}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 max-w-[180px]">
                        <div className="flex items-center gap-1.5 text-sm text-gray-900">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{abstract.email || '—'}</span>
                        </div>
                        {abstract.registration_id && (
                          <StatusBadge tone="success" className="mt-1">
                            {t('linkedToRegistration')}
                          </StatusBadge>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailAbstract(abstract)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                          >
                            {t('viewDetails')}
                          </button>
                          {abstract.file_path && (
                            <button
                              type="button"
                              onClick={() => downloadAbstract(abstract)}
                              disabled={downloadingId === abstract.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {downloadingId === abstract.id ? '…' : t('download')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AbstractDetailDrawer
        abstract={detailAbstract}
        open={Boolean(detailAbstract)}
        reviews={detailAbstract ? reviewsByAbstract[detailAbstract.id] || [] : []}
        reviewers={reviewers}
        savingStatus={savingStatus}
        onClose={() => setDetailAbstract(null)}
        onDownload={downloadAbstract}
        onUpdateStatus={(abstract, status, options) =>
          patchStatus(abstract, status, options)
        }
        onSaveNotes={saveDecisionNotes}
        onAssignReviewer={assignReviewer}
        onUnassignReviewer={unassignReviewer}
        onRemindReviewer={(reviewerId) => remindReviewers(reviewerId)}
      />
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
