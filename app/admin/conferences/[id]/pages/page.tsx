'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { showError, showSuccess } from '@/utils/toast'
import type { ConferencePage } from '@/types/conference-page'
import { PAGE_TEMPLATES, getTemplateById, generateInfoCardsFromConference } from '@/templates/page-templates'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ConferencePagesAdminPage() {
  const params = useParams()
  const conferenceId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<ConferencePage[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState(false)

  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank')
  const [conferenceData, setConferenceData] = useState<{
    start_date?: string | null
    location?: string | null
    venue?: string | null
  } | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [pages])

  const loadPages = async () => {
    if (!conferenceId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/conferences/${conferenceId}/pages`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.details || data.error || 'Failed to fetch pages'
        throw new Error(errorMsg)
      }
      setPages(data.pages || [])
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to load pages'
      showError(errorMsg)
      console.error('Failed to load pages:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPages()
    loadConferenceData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId])

  const loadConferenceData = async () => {
    if (!conferenceId) return
    try {
      const res = await fetch(`/api/admin/conferences/${conferenceId}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setConferenceData({
          start_date: data.conference?.start_date,
          location: data.conference?.location,
          venue: data.conference?.venue,
        })
      }
    } catch (e) {
      // Silently fail - template system will work without conference data
    }
  }

  // Smart slug defaults: auto-generate slug from title unless user manually edits slug.
  useEffect(() => {
    if (slugTouched) return
    const s = slugify(newTitle)
    setNewSlug(s)
  }, [newTitle, slugTouched])

  const createPage = async () => {
    if (!newTitle.trim() || !newSlug.trim()) {
      showError('Title and slug are required')
      return
    }
    try {
      setCreating(true)
      const template = getTemplateById(selectedTemplate)
      
      // Prepare page data with template defaults
      const pageData: any = {
        title: newTitle.trim(),
        slug: newSlug.trim(),
        content: template?.suggestedContent || '',
        sort_order: sortedPages.length,
        published: false,
      }

      // Apply template defaults
      if (template) {
        pageData.hero_layout_type = template.heroLayoutType
        if (template.heroBackgroundColor) {
          pageData.hero_background_color = template.heroBackgroundColor
        }
        
        // Auto-populate info cards if template requires it and we have conference data
        if (template.autoPopulateInfoCards && conferenceData) {
          const infoCards = generateInfoCardsFromConference(conferenceData)
          if (infoCards.length > 0) {
            pageData.hero_info_cards = infoCards
          }
        }
      }

      const res = await fetch(`/api/admin/conferences/${conferenceId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Failed to create page')
      showSuccess('Page created')
      setNewTitle('')
      setNewSlug('')
      setSlugTouched(false)
      setSelectedTemplate('blank')
      await loadPages()
    } catch (e: any) {
      showError(e?.message || 'Failed to create page')
    } finally {
      setCreating(false)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDraggedOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDraggedOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDraggedOverIndex(null)
      return
    }

    const newPages = [...sortedPages]
    const [draggedItem] = newPages.splice(draggedIndex, 1)
    newPages.splice(dropIndex, 0, draggedItem)

    // Update sort_order for all affected pages
    const updates = newPages.map((p, idx) => ({
      id: p.id,
      sort_order: idx,
    }))

    try {
      setUpdatingOrder(true)
      await Promise.all(
        updates.map((update) =>
          fetch(`/api/admin/conferences/${conferenceId}/pages/${update.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: update.sort_order }),
          })
        )
      )
      showSuccess('Order updated')
      await loadPages()
    } catch (e: any) {
      showError('Failed to update order')
    } finally {
      setUpdatingOrder(false)
      setDraggedIndex(null)
      setDraggedOverIndex(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conference Pages</h1>
          <p className="text-gray-600 mt-1">
            Phase 1: create custom pages (stored as plain text and rendered safely).
          </p>
        </div>
        <Link
          href={`/admin/conferences/${conferenceId}/settings`}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back to Settings
        </Link>
      </div>

      {/* Create */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create new page</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Template (Optional)</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAGE_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose a template to auto-configure hero layout and styling. You can change everything later.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Venue"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
              <input
                value={newSlug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setNewSlug(e.target.value)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. venue"
              />
              <p className="text-xs text-gray-500 mt-2">Used in URL: `/conferences/[slug]/p/{newSlug || '...'}`</p>
            </div>
            <div className="md:col-span-1 flex items-end justify-end">
              <button
                onClick={createPage}
                disabled={creating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
          <button
            onClick={loadPages}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-gray-600">Loading…</div>
        ) : sortedPages.length === 0 ? (
          <div className="p-6 text-gray-600">No pages yet.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedPages.map((p, index) => (
              <div
                key={p.id}
                draggable={!updatingOrder}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={`px-6 py-4 flex items-center justify-between gap-4 ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${
                  draggedOverIndex === index ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                } ${!updatingOrder ? 'cursor-move hover:bg-gray-50' : ''} transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Drag handle */}
                  <div className="flex-shrink-0 text-gray-400 cursor-move">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-gray-900 truncate">{p.title}</div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          p.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p.published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-gray-500">order: {p.sort_order ?? 0}</span>
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      Slug: <span className="font-mono">{p.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/conferences/${conferenceId}/pages/${p.id}`}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-sm font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

