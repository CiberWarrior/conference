'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

interface ProgramData {
  conference: {
    name: string
    slug: string
    start_date?: string
    end_date?: string
    location?: string
    primary_color?: string
  }
  sessions: Array<{
    id: string
    title: string
    description?: string
    track?: string
    room?: string
    session_type: string
    starts_at?: string
    ends_at?: string
    items?: Array<{
      id: string
      title?: string
      speaker_name?: string
      starts_at?: string
      ends_at?: string
    }>
  }>
}

export default function PublicProgramPage() {
  const t = useTranslations('publicProgram')
  const locale = useLocale()
  const params = useParams()
  const slug = params?.slug as string
  const [data, setData] = useState<ProgramData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/conferences/${slug}/program`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || t('unavailable'))
        setData(json)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t('loading')}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        {error || t('unavailable')}
      </div>
    )
  }

  const accent = data.conference.primary_color || '#1e3c72'
  const dateLocale = locale === 'hr' ? 'hr-HR' : 'en-US'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="text-white px-6 py-12" style={{ backgroundColor: accent }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-wide opacity-80">{t('label')}</p>
          <h1 className="text-3xl font-bold mt-2">{data.conference.name}</h1>
          {(data.conference.location || data.conference.start_date) && (
            <p className="mt-3 opacity-90 text-sm">
              {[
                data.conference.location,
                data.conference.start_date
                  ? new Date(data.conference.start_date).toLocaleDateString(dateLocale)
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {data.sessions.length === 0 ? (
          <p className="text-gray-500">{t('empty')}</p>
        ) : (
          data.sessions.map((session) => (
            <section key={session.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{session.title}</h2>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  {session.session_type}
                </span>
              </div>
              {(session.room || session.track) && (
                <p className="text-sm text-slate-500 mt-1">
                  {[session.room, session.track].filter(Boolean).join(' · ')}
                </p>
              )}
              {session.description && (
                <p className="text-sm text-slate-600 mt-2">{session.description}</p>
              )}
              <ul className="mt-4 space-y-2">
                {(session.items || []).map((item) => (
                  <li key={item.id} className="text-sm border-t border-slate-100 pt-2">
                    <span className="font-medium text-slate-800">
                      {item.title || t('presentation')}
                    </span>
                    {item.speaker_name && (
                      <span className="text-slate-500"> — {item.speaker_name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </div>
  )
}
