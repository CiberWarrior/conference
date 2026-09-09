'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function ManageRegistrationPage() {
  const t = useTranslations('registrationManage')
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string
  const token = searchParams?.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!slug || !token) {
      setError(t('missingToken'))
      setLoading(false)
      return
    }
    fetch(`/api/conferences/${slug}/manage?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || t('invalidLink'))
        setData(json)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug, token, t])

  const requestCancel = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(
        `/api/conferences/${slug}/manage?token=${encodeURIComponent(token)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request_cancel', reason }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('invalidLink'))
      setMessage(t('cancelRequested'))
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

  const cancelRequested = Boolean(data.registration?.custom_data?.cancel_requested_at)

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-600">{data.conference.name}</p>

        <dl className="text-sm space-y-2 border-t border-slate-100 pt-4">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">{t('name')}</dt>
            <dd className="font-medium text-right">
              {[data.registration.contact?.firstName, data.registration.contact?.lastName]
                .filter(Boolean)
                .join(' ') || '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">{t('email')}</dt>
            <dd className="font-medium text-right">{data.registration.contact?.email || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">{t('payment')}</dt>
            <dd className="font-medium text-right">{data.registration.payment_status}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">{t('registrationId')}</dt>
            <dd className="font-mono text-xs text-right break-all">{data.registration.id}</dd>
          </div>
        </dl>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h2 className="font-semibold text-slate-900 text-sm">{t('requestCancelTitle')}</h2>
          {cancelRequested ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
              {t('alreadyRequested')}
            </p>
          ) : (
            <>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder={t('cancelReasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={requestCancel}
                className="w-full py-2.5 rounded-lg bg-slate-800 text-white text-sm font-medium disabled:opacity-50"
              >
                {busy ? t('sending') : t('requestCancel')}
              </button>
            </>
          )}
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>
      </div>
    </div>
  )
}
