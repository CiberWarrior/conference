'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  X,
  Download,
  Users,
  FileText,
  ClipboardList,
  MessageSquare,
  Trash2,
  Mail,
} from 'lucide-react'
import StatusBadge, { type StatusBadgeTone } from '@/components/admin/StatusBadge'
import {
  getAbstractContent,
  getAbstractKeywords,
  getAbstractType,
  getAbstractTitle,
  getAuthorAffiliations,
  isDocumentUploadAbstract,
  summarizeReviews,
  type AbstractStatus,
  type ReviewLike,
} from '@/lib/abstract-display'

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 Bytes'
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`
}

export const ABSTRACT_STATUS_TONE: Record<AbstractStatus, StatusBadgeTone> = {
  pending: 'neutral',
  under_review: 'warning',
  revise: 'violet',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
}

export const ABSTRACT_STATUS_LABEL_KEY: Record<AbstractStatus, string> = {
  pending: 'statusPending',
  under_review: 'statusUnderReview',
  revise: 'statusRevise',
  accepted: 'statusAccepted',
  rejected: 'statusRejected',
  withdrawn: 'statusWithdrawn',
}

const STATUS_ACTION_KEY: Record<AbstractStatus, string> = {
  pending: 'setStatusPending',
  under_review: 'setStatusUnderReview',
  revise: 'setStatusRevise',
  accepted: 'setStatusAccepted',
  rejected: 'setStatusRejected',
  withdrawn: 'setStatusWithdrawn',
}

const RECOMMENDATION_LABEL_KEY: Record<string, string> = {
  accept: 'recAccept',
  revise: 'recRevise',
  reject: 'recReject',
}

export interface AbstractRecord {
  id: string
  file_name?: string | null
  file_path?: string | null
  file_size?: number | null
  email: string | null
  uploaded_at: string
  conference_id: string | null
  registration_id: string | null
  title?: string | null
  status?: string
  decision_notes?: string | null
  decided_at?: string | null
  custom_data: Record<string, any> | null
  authors?: Array<{
    firstName?: string
    lastName?: string
    email?: string
    affiliations?: string[]
    /** Legacy single-institution field */
    affiliation?: string
    country?: string
    city?: string
    orcid?: string
    isCorresponding?: boolean
  }> | null
}

interface AbstractDetailDrawerProps {
  abstract: AbstractRecord | null
  open: boolean
  reviews: ReviewLike[]
  reviewers: Array<{ id: string; email: string; name?: string | null }>
  savingStatus: boolean
  onClose: () => void
  onDownload: (abstract: AbstractRecord) => void
  onUpdateStatus: (
    abstract: AbstractRecord,
    status: AbstractStatus,
    options: { decisionNotes: string; notify: boolean }
  ) => Promise<void> | void
  onSaveNotes: (abstract: AbstractRecord, decisionNotes: string) => Promise<void> | void
  onAssignReviewer: (abstract: AbstractRecord, reviewerId: string) => void
  onUnassignReviewer: (abstract: AbstractRecord, reviewId: string) => void
  onRemindReviewer: (reviewerId: string) => void
}

const DECISION_STATUSES: AbstractStatus[] = [
  'under_review',
  'revise',
  'accepted',
  'rejected',
  'withdrawn',
]

function Section({
  title,
  icon,
  children,
  action,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-gray-500">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </section>
  )
}

export default function AbstractDetailDrawer({
  abstract,
  open,
  reviews,
  reviewers,
  savingStatus,
  onClose,
  onDownload,
  onUpdateStatus,
  onSaveNotes,
  onAssignReviewer,
  onUnassignReviewer,
  onRemindReviewer,
}: AbstractDetailDrawerProps) {
  const t = useTranslations('admin.abstracts')
  const locale = useLocale()
  const [notes, setNotes] = useState('')
  const [notify, setNotify] = useState(true)

  useEffect(() => {
    setNotes(abstract?.decision_notes || '')
    setNotify(true)
  }, [abstract?.id, abstract?.decision_notes])

  if (!open || !abstract) return null

  const status = (abstract.status || 'pending') as AbstractStatus
  const summary = summarizeReviews(reviews)
  const content = getAbstractContent(abstract)
  const keywords = getAbstractKeywords(abstract)
  const type = getAbstractType(abstract)
  const isDocument = isDocumentUploadAbstract(abstract)
  const dateLocale = locale === 'hr' ? 'hr-HR' : 'en-US'
  const assignedReviewerIds = new Set(reviews.map((r) => r.reviewer?.id).filter(Boolean))
  const availableReviewers = reviewers.filter((r) => !assignedReviewerIds.has(r.id))

  const extraFields = Object.entries(abstract.custom_data || {}).filter(
    ([key, value]) =>
      ![
        'abstractTitle',
        'abstractContent',
        'abstractKeywords',
        'abstractType',
        'submissionMethod',
      ].includes(key) &&
      value !== null &&
      value !== undefined &&
      value !== ''
  )

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="abstract-detail-title"
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge tone={ABSTRACT_STATUS_TONE[status]}>
                {t(ABSTRACT_STATUS_LABEL_KEY[status])}
              </StatusBadge>
              <StatusBadge tone={isDocument ? 'violet' : 'neutral'}>
                {isDocument ? t('methodDocument') : t('methodOnlineForm')}
              </StatusBadge>
              {type && <span className="text-xs text-gray-500 capitalize">{type}</span>}
            </div>
            <h2
              id="abstract-detail-title"
              className="text-lg font-bold text-gray-900 break-words"
            >
              {getAbstractTitle(abstract, t('untitled'))}
            </h2>
            <p className="text-sm text-gray-500 truncate">{abstract.email || '—'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <Section
            title={t('detailsAbstract')}
            icon={<FileText className="w-4 h-4" />}
            action={
              abstract.file_path && !isDocument ? (
                <button
                  type="button"
                  onClick={() => onDownload(abstract)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('download')}
                </button>
              ) : undefined
            }
          >
            {isDocument ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <FileText className="w-5 h-5 text-violet-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {abstract.file_name || t('documentSubmission')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {abstract.file_size ? formatFileSize(abstract.file_size) : t('documentSubmission')}
                  </p>
                </div>
                {abstract.file_path ? (
                  <button
                    type="button"
                    onClick={() => onDownload(abstract)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
                  >
                    <Download className="w-4 h-4" />
                    {t('downloadDocument')}
                  </button>
                ) : (
                  <span className="text-xs text-red-600">{t('documentMissing')}</span>
                )}
              </div>
            ) : content ? (
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {content}
              </p>
            ) : (
              <p className="text-sm text-gray-500">{t('noAbstractText')}</p>
            )}
            {keywords && (
              <p className="text-sm text-gray-600">
                <span className="text-gray-500">{t('keywords')}: </span>
                {keywords}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {abstract.file_name ? `${abstract.file_name} · ` : ''}
              {new Date(abstract.uploaded_at).toLocaleString(dateLocale)}
            </p>
            {extraFields.length > 0 && (
              <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-gray-100 pt-3">
                {extraFields.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-gray-500">{key}</dt>
                    <dd className="text-gray-900 break-words">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Section>

          {abstract.authors && abstract.authors.length > 0 && (
            <Section title={t('authors')} icon={<Users className="w-4 h-4" />}>
              <ol className="space-y-2">
                {abstract.authors.map((author, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-medium text-gray-900">
                      {[author.firstName, author.lastName].filter(Boolean).join(' ')}
                    </span>
                    {author.isCorresponding && (
                      <span className="ml-1.5 text-xs text-blue-600">
                        {t('corresponding')}
                      </span>
                    )}
                    {getAuthorAffiliations(author).map((affiliation) => (
                      <div key={affiliation} className="text-xs text-gray-500">
                        {affiliation}
                      </div>
                    ))}
                    {(author.city || author.country) && (
                      <div className="text-xs text-gray-500">
                        {[author.city, author.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {author.email && (
                      <div className="text-xs text-gray-500">{author.email}</div>
                    )}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          <Section
            title={t('detailsReviews')}
            icon={<ClipboardList className="w-4 h-4" />}
            action={
              availableReviewers.length > 0 ? (
                <select
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white max-w-[170px]"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onAssignReviewer(abstract, e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">{t('assignReviewer')}</option>
                  {availableReviewers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || r.email}
                    </option>
                  ))}
                </select>
              ) : undefined
            }
          >
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">{t('noReviewsYet')}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>
                    {t('reviewsSubmittedCount', {
                      submitted: summary.submitted,
                      total: summary.total,
                    })}
                  </span>
                  {summary.averageScore != null && (
                    <span className="font-medium text-gray-900">
                      {t('averageScore')}: {summary.averageScore}
                    </span>
                  )}
                  <span>
                    {t('recAccept')} {summary.accept} · {t('recRevise')} {summary.revise} ·{' '}
                    {t('recReject')} {summary.reject}
                  </span>
                </div>
                <ul className="space-y-2">
                  {reviews.map((review) => (
                    <li
                      key={review.id}
                      className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {review.reviewer?.name || review.reviewer?.email || '—'}
                          </p>
                          {review.submitted_at ? (
                            <p className="text-xs text-gray-500">
                              {new Date(review.submitted_at).toLocaleString(dateLocale)}
                            </p>
                          ) : (
                            <p className="text-xs text-amber-700">{t('reviewPending')}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {review.score != null && (
                            <StatusBadge tone="info">{review.score}/5</StatusBadge>
                          )}
                          {review.recommendation && (
                            <StatusBadge
                              tone={
                                review.recommendation === 'accept'
                                  ? 'success'
                                  : review.recommendation === 'reject'
                                    ? 'danger'
                                    : 'violet'
                              }
                            >
                              {t(
                                RECOMMENDATION_LABEL_KEY[review.recommendation] ||
                                  'recRevise'
                              )}
                            </StatusBadge>
                          )}
                          {!review.submitted_at && review.reviewer?.id && (
                            <button
                              type="button"
                              onClick={() => onRemindReviewer(review.reviewer!.id)}
                              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              title={t('remindReviewer')}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onUnassignReviewer(abstract, review.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title={t('unassignReviewer')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {review.comments && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2 pt-2 border-t border-gray-100">
                          {review.comments}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Section>

          <Section title={t('detailsDecision')} icon={<MessageSquare className="w-4 h-4" />}>
            <label className="block text-sm">
              <span className="text-gray-600">{t('decisionNotes')}</span>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('decisionNotesPlaceholder')}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </label>
            <p className="text-xs text-gray-500">{t('decisionNotesHint')}</p>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 size-4"
              />
              {t('notifyAuthor')}
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={savingStatus}
                onClick={() => onSaveNotes(abstract, notes)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('saveNotes')}
              </button>
              {DECISION_STATUSES.filter((s) => s !== status).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={savingStatus}
                  onClick={() => onUpdateStatus(abstract, s, { decisionNotes: notes, notify })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg text-white disabled:opacity-50 ${
                    s === 'accepted'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : s === 'rejected'
                        ? 'bg-red-600 hover:bg-red-700'
                        : s === 'revise'
                          ? 'bg-violet-600 hover:bg-violet-700'
                          : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {t(STATUS_ACTION_KEY[s])}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="shrink-0 px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t('close')}
          </button>
        </div>
      </aside>
    </>
  )
}
