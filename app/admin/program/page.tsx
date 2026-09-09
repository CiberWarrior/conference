'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useConference } from '@/contexts/ConferenceContext'
import { showError, showSuccess } from '@/utils/toast'

interface Session {
  id: string
  title: string
  description?: string | null
  track?: string | null
  room?: string | null
  session_type: string
  starts_at?: string | null
  ends_at?: string | null
  sort_order: number
  items?: Array<{
    id: string
    title?: string | null
    speaker_name?: string | null
    abstract_id?: string | null
    abstract?: { id: string; file_name: string; title?: string; status?: string }
  }>
}

interface AcceptedAbstract {
  id: string
  file_name: string
  title?: string | null
  email?: string | null
}

export default function ProgramAdminPage() {
  const t = useTranslations('admin.program')
  const { currentConference } = useConference()
  const [sessions, setSessions] = useState<Session[]>([])
  const [accepted, setAccepted] = useState<AcceptedAbstract[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [room, setRoom] = useState('')
  const [track, setTrack] = useState('')
  const [sessionType, setSessionType] = useState('oral')

  const load = async () => {
    if (!currentConference?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/program?conferenceId=${currentConference.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('loadFailed'))
      setSessions(data.sessions || [])

      const { supabase } = await import('@/lib/supabase')
      const { data: abs } = await supabase
        .from('abstracts')
        .select('id, file_name, title, email')
        .eq('conference_id', currentConference.id)
        .eq('status', 'accepted')
        .order('uploaded_at', { ascending: false })
      setAccepted(abs || [])
    } catch (e: any) {
      showError(e.message || t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConference?.id])

  const createSession = async () => {
    if (!currentConference?.id || !title.trim()) return
    const res = await fetch('/api/admin/program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conferenceId: currentConference.id,
        action: 'create_session',
        title: title.trim(),
        room: room || null,
        track: track || null,
        session_type: sessionType,
        sort_order: sessions.length,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      showError(data.error || t('createFailed'))
      return
    }
    showSuccess(t('sessionCreated'))
    setTitle('')
    setRoom('')
    setTrack('')
    load()
  }

  const deleteSession = async (sessionId: string) => {
    if (!currentConference?.id || !confirm(t('deleteSessionConfirm'))) return
    const res = await fetch('/api/admin/program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conferenceId: currentConference.id,
        action: 'delete_session',
        sessionId,
      }),
    })
    if (!res.ok) {
      showError(t('deleteFailed'))
      return
    }
    load()
  }

  const addAbstract = async (sessionId: string, abstractId: string) => {
    if (!currentConference?.id || !abstractId) return
    const abs = accepted.find((a) => a.id === abstractId)
    const res = await fetch('/api/admin/program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conferenceId: currentConference.id,
        action: 'add_item',
        sessionId,
        abstractId,
        title: abs?.title || abs?.file_name,
        speaker_name: abs?.email || null,
      }),
    })
    if (!res.ok) {
      showError(t('addFailed'))
      return
    }
    showSuccess(t('addedToSession'))
    load()
  }

  if (!currentConference) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        {t('selectConference')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('subtitle')}{' '}
          <a
            className="text-blue-600 underline"
            href={`/conferences/${currentConference.slug}/program`}
            target="_blank"
            rel="noreferrer"
          >
            /conferences/{currentConference.slug}/program
          </a>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 grid gap-3 md:grid-cols-4">
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder={t('sessionTitle')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder={t('room')}
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder={t('track')}
          value={track}
          onChange={(e) => setTrack(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
          >
            <option value="oral">{t('sessionOral')}</option>
            <option value="poster">{t('sessionPoster')}</option>
            <option value="keynote">{t('sessionKeynote')}</option>
            <option value="break">{t('sessionBreak')}</option>
            <option value="other">{t('sessionOther')}</option>
          </select>
          <button
            type="button"
            onClick={createSession}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium"
          >
            {t('add')}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">{t('loading')}</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500">{t('noSessions')}</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{session.title}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {[session.session_type, session.room, session.track].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSession(session.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  {t('delete')}
                </button>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                {(session.items || []).map((item) => (
                  <li key={item.id} className="flex justify-between border-b border-gray-100 py-1">
                    <span>{item.title || item.abstract?.file_name || t('itemFallback')}</span>
                    <span className="text-gray-400 text-xs">{item.speaker_name}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex gap-2">
                <select
                  id={`add-${session.id}`}
                  className="border rounded-lg px-3 py-2 text-sm flex-1"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addAbstract(session.id, e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">{t('addAbstractOption')}</option>
                  {accepted.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title || a.file_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
