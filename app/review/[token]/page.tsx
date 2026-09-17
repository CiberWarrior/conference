'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Download, FileText, CheckCircle2 } from 'lucide-react'

interface ReviewAbstract {
  id: string
  file_name: string
  file_size?: number | null
  title?: string
  status?: string
  submission_method?: 'online_form' | 'document_upload'
  content?: string | null
  keywords?: string | null
  type?: string | null
  custom_data?: Record<string, unknown>
  authors?: Array<{
    firstName?: string
    lastName?: string
    affiliations?: string[]
    country?: string
  }>
}

interface ReviewRow {
  id: string
  score?: number | null
  comments?: string | null
  recommendation?: string | null
  submitted_at?: string | null
  abstract?: ReviewAbstract
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${Math.round((bytes / Math.pow(1024, i)) * 10) / 10} ${units[i]}`
}

export default function ReviewerPortalPage() {
  const t = useTranslations('reviewerPortal')
  const locale = useLocale()
  const params = useParams()
  const token = params?.token as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewer, setReviewer] = useState<any>(null)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, Partial<ReviewRow>>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/review/${token}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || t('invalidLink'))
        setReviewer(json.reviewer)
        setReviews(json.reviews || [])
        const initial: Record<string, Partial<ReviewRow>> = {}
        for (const r of json.reviews || []) {
          initial[r.id] = {
            score: r.score,
            comments: r.comments,
            recommendation: r.recommendation,
          }
        }
        setDrafts(initial)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const submit = async (reviewId: string) => {
    setSaving(reviewId)
    setFormError(null)
    try {
      const draft = drafts[reviewId] || {}
      const res = await fetch(`/api/review/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          score: draft.score ? Number(draft.score) : null,
          comments: draft.comments || null,
          recommendation: draft.recommendation || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('invalidLink'))
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, ...draft, submitted_at: new Date().toISOString() }
            : r
        )
      )
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setSaving(null)
    }
  }

  const downloadFile = async (reviewId: string) => {
    setDownloading(reviewId)
    setFormError(null)
    try {
      const res = await fetch(`/api/review/${token}/download?reviewId=${reviewId}`)
      const json = await res.json()
      if (!res.ok || !json.url) throw new Error(json.error || t('downloadFailed'))
      window.open(json.url, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      setFormError(e.message || t('downloadFailed'))
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t('loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 px-6 text-center">
        {error}
      </div>
    )
  }

  const submittedCount = reviews.filter((r) => r.submitted_at).length

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {reviewer?.conference?.name || 'Conference'} · {reviewer?.email}
          </p>
          {reviews.length > 0 && (
            <p className="text-sm font-medium text-slate-700 mt-3">
              {t('progress', { done: submittedCount, total: reviews.length })}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-2">{t('blindNote')}</p>
        </header>

        {formError && (
          <p
            role="alert"
            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
          >
            {formError}
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="text-slate-500">{t('noAssigned')}</p>
        ) : (
          reviews.map((review) => {
            const draft = drafts[review.id] || {}
            const abstract = review.abstract
            const extraFields = Object.entries(abstract?.custom_data || {}).filter(
              ([, value]) => value !== null && value !== undefined && value !== ''
            )

            return (
              <article
                key={review.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">
                      {abstract?.title || abstract?.file_name || 'Abstract'}
                    </h2>
                    {review.submitted_at && (
                      <span className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('done')}
                      </span>
                    )}
                  </div>
                  {abstract?.authors?.length ? (
                    <p className="text-xs text-slate-500 mt-1">
                      {abstract.authors
                        .map((a) =>
                          [
                            [a.firstName, a.lastName].filter(Boolean).join(' '),
                            a.affiliations?.join(', '),
                          ]
                            .filter(Boolean)
                            .join(', ')
                        )
                        .filter(Boolean)
                        .join('; ')}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {abstract?.type && (
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 capitalize">
                        {abstract.type}
                      </span>
                    )}
                    {abstract?.keywords && (
                      <span className="text-xs text-slate-600">{abstract.keywords}</span>
                    )}
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {abstract?.content ? (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                        {t('abstractText')}
                      </h3>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {abstract.content}
                      </p>
                    </div>
                  ) : abstract?.submission_method === 'document_upload' ? (
                    <p className="text-sm text-slate-600 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                      {t('documentSubmissionHint')}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">{t('noAbstractText')}</p>
                  )}

                  {extraFields.length > 0 && (
                    <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {extraFields.map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-xs text-slate-500">{key}</dt>
                          <dd className="text-slate-800 break-words">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {abstract?.file_name && (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => downloadFile(review.id)}
                        disabled={downloading === review.id}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        {downloading === review.id ? t('preparingDownload') : t('downloadFile')}
                      </button>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <FileText className="w-3.5 h-3.5" />
                        {abstract.file_name}
                        {abstract.file_size ? ` · ${formatFileSize(abstract.file_size)}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block text-sm">
                      <span className="text-slate-600">{t('score')}</span>
                      <select
                        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                        value={draft.score ?? ''}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [review.id]: {
                              ...d[review.id],
                              score: e.target.value ? Number(e.target.value) : null,
                            },
                          }))
                        }
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm">
                      <span className="text-slate-600">{t('recommendation')}</span>
                      <select
                        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                        value={draft.recommendation ?? ''}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [review.id]: {
                              ...d[review.id],
                              recommendation: e.target.value || null,
                            },
                          }))
                        }
                      >
                        <option value="">—</option>
                        <option value="accept">{t('recAccept')}</option>
                        <option value="revise">{t('recRevise')}</option>
                        <option value="reject">{t('recReject')}</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-sm">
                    <span className="text-slate-600">{t('comments')}</span>
                    <textarea
                      className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                      rows={4}
                      value={draft.comments ?? ''}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [review.id]: { ...d[review.id], comments: e.target.value },
                        }))
                      }
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={saving === review.id}
                      onClick={() => submit(review.id)}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
                    >
                      {saving === review.id
                        ? t('saving')
                        : review.submitted_at
                          ? t('updateReview')
                          : t('submit')}
                    </button>
                    {review.submitted_at && (
                      <p className="text-xs text-emerald-700">
                        {t('submittedAt', {
                          date: new Date(review.submitted_at).toLocaleString(
                            locale === 'hr' ? 'hr-HR' : 'en-US'
                          ),
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
