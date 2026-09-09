'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

interface ReviewRow {
  id: string
  score?: number | null
  comments?: string | null
  recommendation?: string | null
  submitted_at?: string | null
  abstract?: {
    id: string
    file_name: string
    title?: string
    authors?: Array<{ firstName?: string; lastName?: string; affiliation?: string }>
  }
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
      alert(e.message)
    } finally {
      setSaving(null)
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
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {reviewer?.conference?.name || 'Conference'} · {reviewer?.email}
          </p>
          <p className="text-xs text-slate-500 mt-2">{t('blindNote')}</p>
        </header>

        {reviews.length === 0 ? (
          <p className="text-slate-500">{t('noAssigned')}</p>
        ) : (
          reviews.map((review) => {
            const draft = drafts[review.id] || {}
            return (
              <div
                key={review.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <h2 className="font-semibold text-slate-900">
                  {review.abstract?.title || review.abstract?.file_name || 'Abstract'}
                </h2>
                {review.abstract?.authors?.length ? (
                  <p className="text-xs text-slate-500">
                    {review.abstract.authors
                      .map((a) =>
                        [a.firstName, a.lastName].filter(Boolean).join(' ')
                      )
                      .filter(Boolean)
                      .join('; ')}
                  </p>
                ) : null}

                <label className="block text-sm">
                  <span className="text-slate-600">{t('score')}</span>
                  <select
                    className="mt-1 w-full border rounded-lg px-3 py-2"
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
                    className="mt-1 w-full border rounded-lg px-3 py-2"
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

                <label className="block text-sm">
                  <span className="text-slate-600">{t('comments')}</span>
                  <textarea
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    rows={3}
                    value={draft.comments ?? ''}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [review.id]: { ...d[review.id], comments: e.target.value },
                      }))
                    }
                  />
                </label>

                <button
                  type="button"
                  disabled={saving === review.id}
                  onClick={() => submit(review.id)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving === review.id ? t('saving') : t('submit')}
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
            )
          })
        )}
      </div>
    </div>
  )
}
