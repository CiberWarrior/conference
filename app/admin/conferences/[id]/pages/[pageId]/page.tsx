'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { showError, showSuccess } from '@/utils/toast'
import type { ConferencePage } from '@/types/conference-page'
import TiptapEditor from '@/components/admin/TiptapEditor'

export default function ConferencePageEditor() {
  const params = useParams()
  const router = useRouter()
  const conferenceId = params?.id as string
  const pageId = params?.pageId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [page, setPage] = useState<ConferencePage | null>(null)
  const [conferenceSlug, setConferenceSlug] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [sortOrder, setSortOrder] = useState<number>(0)
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [heroBackgroundColor, setHeroBackgroundColor] = useState('')

  const slugPreview = useMemo(() => {
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }, [slug])

  const loadPage = async () => {
    if (!conferenceId || !pageId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/conferences/${conferenceId}/pages/${pageId}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load page')

      const p: ConferencePage = data.page
      setPage(p)
      setConferenceSlug(data.conference_slug || null)
      setTitle(p.title || '')
      setSlug(p.slug || '')
      setContent(p.content || '')
      setPublished(!!p.published)
      setSortOrder(typeof p.sort_order === 'number' ? p.sort_order : 0)
      setHeroSubtitle(p.hero_subtitle || '')
      setHeroImageUrl(p.hero_image_url || '')
      setHeroBackgroundColor(p.hero_background_color || '')
    } catch (e: any) {
      showError(e?.message || 'Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId, pageId])

  const save = async () => {
    try {
      setSaving(true)
      
      // Debug: log content before save
      console.log('Saving content (length):', content.length)
      console.log('Content contains <img>:', content.includes('<img'))
      if (content.includes('<img')) {
        const imgMatch = content.match(/<img[^>]+src="([^"]+)"/)
        if (imgMatch) {
          console.log('Image URL in content:', imgMatch[1])
        }
      }
      
      const res = await fetch(`/api/admin/conferences/${conferenceId}/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          published,
          sort_order: sortOrder,
          hero_subtitle: heroSubtitle || null,
          hero_image_url: heroImageUrl || null,
          hero_background_color: heroBackgroundColor || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save page')
      
      // Debug: log saved content
      console.log('Page saved, content (length):', data.page?.content?.length || 0)
      console.log('Contains img tag:', data.page?.content?.includes('<img'))
      if (data.page?.content?.includes('<img')) {
        const imgMatch = data.page.content.match(/<img[^>]+src="([^"]+)"/)
        if (imgMatch) {
          console.log('Image URL in saved content:', imgMatch[1])
        }
      }
      
      showSuccess('Saved')
      setPage(data.page)
      // Update local content state to match saved page
      if (data.page?.content) {
        setContent(data.page.content)
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  const deletePage = async () => {
    if (!confirm('Delete this page? This cannot be undone.')) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/conferences/${conferenceId}/pages/${pageId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete page')
      showSuccess('Deleted')
      router.push(`/admin/conferences/${conferenceId}/pages`)
    } catch (e: any) {
      showError(e?.message || 'Failed to delete page')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto p-6 text-gray-600">Loading…</div>
  }

  if (!page) {
    return <div className="max-w-5xl mx-auto p-6 text-gray-600">Page not found.</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Page</h1>
          <p className="text-gray-600 mt-1">
            URL slug: <span className="font-mono">{slugPreview || '(empty)'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conferenceSlug && slugPreview && published && (
            <Link
              href={`/conferences/${conferenceSlug}/p/${slugPreview}`}
              target="_blank"
              className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Preview
            </Link>
          )}
          <Link
            href={`/admin/conferences/${conferenceId}/pages`}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back
          </Link>
          <button
            onClick={deletePage}
            disabled={deleting}
            className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-2">
              Public URL: <span className="font-mono">/conferences/[conference]/p/{slugPreview || '...'}</span>
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value || '0', 10))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 select-none">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm font-semibold text-gray-700">Published</span>
            </label>
          </div>
        </div>

        {/* Hero Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Section (Optional)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Hero sekcija će koristiti <strong>Page Title</strong> kao naslov. Dodaj subtitle, background image ili color za dodatni stil.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Background Color</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={heroBackgroundColor}
                  onChange={(e) => setHeroBackgroundColor(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="#3B82F6"
                />
                <input
                  type="color"
                  value={heroBackgroundColor || '#3B82F6'}
                  onChange={(e) => setHeroBackgroundColor(e.target.value)}
                  className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Background Image URL</label>
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Subtitle</label>
              <input
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional subtitle or description"
              />
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your page content here..."
            conferenceId={conferenceId}
          />
          <p className="text-xs text-gray-500 mt-2">
            Use the toolbar to format text, add headings, lists, and links.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

