'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Ticket, Plus, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import type { SupportTicket } from '@/types/support-ticket'
import { useConference } from '@/contexts/ConferenceContext'

interface TicketWithConference extends SupportTicket {
  conferences?: { id: string; name: string } | null
}

function TicketsPageContent() {
  const searchParams = useSearchParams()
  const conferenceIdFromUrl = searchParams.get('conference_id') || ''
  const { conferences } = useConference()
  const [tickets, setTickets] = useState<TicketWithConference[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [form, setForm] = useState({
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    conference_id: conferenceIdFromUrl,
  })
  const [submitting, setSubmitting] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<Record<string, string>>({})

  const loadTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (conferenceIdFromUrl) params.set('conference_id', conferenceIdFromUrl)
      const qs = params.toString()
      const url = qs ? `/api/admin/tickets?${qs}` : '/api/admin/tickets'
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) setTickets(data.tickets || [])
      else setTickets([])
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setForm((f) => ({ ...f, conference_id: conferenceIdFromUrl }))
  }, [conferenceIdFromUrl])

  useEffect(() => {
    loadTickets()
  }, [filterStatus, conferenceIdFromUrl])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.description.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject.trim(),
          description: form.description.trim(),
          priority: form.priority,
          conference_id: form.conference_id || null,
        }),
      })
      if (res.ok) {
        setForm({ subject: '', description: '', priority: 'medium', conference_id: conferenceIdFromUrl })
        setCreateOpen(false)
        loadTickets()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdateStatus((s) => ({ ...s, [id]: status }))
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        loadTickets()
        if (detailId === id) setDetailId(null)
      }
    } finally {
      setUpdateStatus((s) => ({ ...s, [id]: '' }))
    }
  }

  const statusLabel: Record<string, string> = {
    open: 'Open',
    in_progress: 'In progress',
    resolved: 'Resolved',
    closed: 'Closed',
  }
  const statusColor: Record<string, string> = {
    open: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  }
  const priorityColor: Record<string, string> = {
    low: 'text-gray-600',
    medium: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Support Tickets</h2>
          <p className="mt-2 text-gray-600">
            Internal support requests and issues
          </p>
        </div>
        <div className="flex items-center gap-3">
          {conferenceIdFromUrl ? (
            <Link
              href={`/admin/conferences/${conferenceIdFromUrl}/settings`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Natrag na postavke konferencije
            </Link>
          ) : (
            <Link
              href="/admin/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCreateOpen(!createOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            {conferenceIdFromUrl ? 'New ticket for this conference' : 'New ticket'}
          </button>
        </div>
      </div>

      {/* Create ticket form (collapsible) */}
      {createOpen && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create ticket</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief summary"
                maxLength={500}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                placeholder="Details of the issue or request"
                required
              />
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent',
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              {conferences.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conference (optional)
                  </label>
                  <select
                    value={form.conference_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, conference_id: e.target.value }))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                  >
                    <option value="">— None —</option>
                    {conferences.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create ticket'}
              </button>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">
              {filterStatus === 'all'
                ? 'No tickets yet. Create one to get started.'
                : 'No tickets with this status.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setDetailId(detailId === t.id ? null : t.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[t.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {statusLabel[t.status] || t.status}
                      </span>
                      <span
                        className={`text-xs font-medium ${priorityColor[t.priority] || ''}`}
                      >
                        {t.priority}
                      </span>
                      {t.conferences?.name && (
                        <span className="text-xs text-gray-500">
                          {t.conferences.name}
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mt-1 truncate">
                      {t.subject}
                    </h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(t.created_at).toLocaleString()}
                      {t.created_by_email && ` · ${t.created_by_email}`}
                    </p>
                  </div>
                  {detailId === t.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </div>

                {detailId === t.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                      {t.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500">Change status:</span>
                      {(['open', 'in_progress', 'resolved', 'closed'] as const).map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={updateStatus[t.id] === s || t.status === s}
                            onClick={() => handleUpdateStatus(t.id, s)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              t.status === s
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } disabled:opacity-50`}
                          >
                            {updateStatus[t.id] === s ? '...' : statusLabel[s]}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600 mt-2">Učitavanje...</p>
          </div>
        </div>
      }
    >
      <TicketsPageContent />
    </Suspense>
  )
}
