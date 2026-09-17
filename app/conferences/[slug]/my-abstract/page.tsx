'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { FileText } from 'lucide-react'

type AbstractStatus =
  | 'pending'
  | 'under_review'
  | 'revise'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

const STATUS_TONE: Record<AbstractStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  under_review: 'bg-amber-50 text-amber-800 border-amber-200',
  revise: 'bg-orange-50 text-orange-800 border-orange-200',
  accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-50 text-red-800 border-red-200',
  withdrawn: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function MyAbstractPage() {
  const t = useTranslations('abstractManage')
  const locale = useLocale()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string
  const token = searchParams?.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)

  useEffect(() => {
    if (!slug || !token) {
      setError(t('missingToken'))
      setLoading(false)
      return
    }
    fetch(`/api/conferences/${slug}/my-abstract?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || t('invalidLink'))
        setData(json)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug, token, t])

  const withdraw = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(
        `/api/conferences/${slug}/my-abstract?token=${encodeURIComponent(token)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'withdraw' }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('invalidLink'))
      setData((prev: any) => ({
        ...prev,
        abstract: { ...prev.abstract, status: 'withdrawn' },
      }))
      setConfirmWithdraw(false)
      setMessage(t('withdrawn'))
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t('loading')}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 px-6 text-center">
        {error || t('unableToLoad')}
      </div>
    )
  }

  const abstract = data.abstract
  const status = (abstract.status || 'pending') as AbstractStatus
  const canWithdraw = !['withdrawn', 'accepted', 'rejected'].includes(status)
  const dateLocale = locale === 'hr' ? 'hr-HR' : 'en-US'

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-600 mt-1">{data.conference.name}</p>
        </header>

        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              {abstract.title || abstract.file_name}
            </h2>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}
            >
              {t(`status_${status}`)}
            </span>
          </div>

          <p className="text-sm text-slate-600">{t(`statusHelp_${status}`)}</p>

          {abstract.decision_notes && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('organizerNotes')}
              </h3>
              <p className="text-sm text-slate-800 whitespace-pre-wrap mt-1">
                {abstract.decision_notes}
              </p>
            </div>
          )}

          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-slate-100 pt-4">
            {abstract.type && (
              <div>
                <dt className="text-slate-500">{t('presentationType')}</dt>
                <dd className="font-medium text-slate-900 capitalize">{abstract.type}</dd>
              </div>
            )}
            {abstract.keywords && (
              <div>
                <dt className="text-slate-500">{t('keywords')}</dt>
                <dd className="font-medium text-slate-900">{abstract.keywords}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500">{t('submittedAt')}</dt>
              <dd className="font-medium text-slate-900">
                {new Date(abstract.uploaded_at).toLocaleString(dateLocale)}
              </dd>
            </div>
            {abstract.authors?.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-slate-500">{t('authors')}</dt>
                <dd className="font-medium text-slate-900">
                  {abstract.authors
                    .map((a: any) => [a.firstName, a.lastName].filter(Boolean).join(' '))
                    .filter(Boolean)
                    .join('; ')}
                </dd>
              </div>
            )}
          </dl>

          {abstract.file_name && (
            <p className="flex items-center gap-2 text-sm text-slate-600 border-t border-slate-100 pt-4">
              <FileText className="w-4 h-4 text-slate-400" />
              {abstract.file_name}
            </p>
          )}

          {abstract.content && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                {t('abstractText')}
              </h3>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {abstract.content}
              </p>
            </div>
          )}
        </section>

        {(canWithdraw || message) && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
            {canWithdraw && (
              <>
                <h2 className="text-sm font-semibold text-slate-900">{t('withdrawTitle')}</h2>
                <p className="text-sm text-slate-600">{t('withdrawHelp')}</p>
                {confirmWithdraw ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={withdraw}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {busy ? t('sending') : t('withdrawConfirm')}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmWithdraw(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmWithdraw(true)}
                    className="px-4 py-2 rounded-lg border border-red-300 bg-white text-red-700 text-sm font-medium hover:bg-red-50"
                  >
                    {t('withdrawAction')}
                  </button>
                )}
              </>
            )}
            {message && <p className="text-sm text-slate-700">{message}</p>}
          </section>
        )}

        <p className="text-xs text-slate-500 text-center">{t('keepLinkNote')}</p>
      </div>
    </div>
  )
}
