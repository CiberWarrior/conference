'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { showError, showSuccess } from '@/utils/toast'
import type { ConferencePage } from '@/types/conference-page'
import TiptapEditor from '@/components/admin/TiptapEditor'
import { sanitizeHtml } from '@/utils/sanitize-html'

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
  const [heroLayoutType, setHeroLayoutType] = useState('centered')
  const [heroLogoUrl, setHeroLogoUrl] = useState('')
  const [heroInfoCards, setHeroInfoCards] = useState<string>('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [ogImageUrl, setOgImageUrl] = useState('')
  const [customCss, setCustomCss] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'preview' | 'hero' | 'basic' | 'seo' | 'advanced'>('content')

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
      setHeroLayoutType(p.hero_layout_type || 'centered')
      setHeroLogoUrl(p.hero_logo_url || '')
      setHeroInfoCards(p.hero_info_cards ? JSON.stringify(p.hero_info_cards, null, 2) : '')
      setMetaTitle(p.meta_title || '')
      setMetaDescription(p.meta_description || '')
      setOgImageUrl(p.og_image_url || '')
      setCustomCss(p.custom_css || '')
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
          hero_layout_type: heroLayoutType || null,
          hero_logo_url: heroLogoUrl || null,
          hero_info_cards: heroInfoCards ? (() => {
            try {
              return JSON.parse(heroInfoCards)
            } catch {
              return null
            }
          })() : null,
          meta_title: metaTitle || null,
          meta_description: metaDescription || null,
          og_image_url: ogImageUrl || null,
          custom_css: customCss || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save page')

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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { id: 'basic', label: 'Basic' },
              { id: 'hero', label: 'Hero' },
              { id: 'content', label: 'Content' },
              { id: 'seo', label: 'SEO' },
              { id: 'advanced', label: 'Advanced' },
              { id: 'preview', label: 'Preview' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
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
            </div>
          )}

          {/* Hero Tab */}
          {activeTab === 'hero' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Section (Optional)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Hero sekcija će koristiti <strong>Page Title</strong> kao naslov. Odaberi layout tip i konfiguriraj stil.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Layout Type</label>
                  <select
                    value={heroLayoutType}
                    onChange={(e) => setHeroLayoutType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="centered">Centered (default)</option>
                    <option value="split">Split (text left, logo right - like homepage)</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Background Color</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={heroBackgroundColor}
                  onChange={(e) => setHeroBackgroundColor(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="#DC2626 (red) or #3B82F6 (blue)"
                />
                <input
                  type="color"
                  value={heroBackgroundColor || '#DC2626'}
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
            
            {heroLayoutType === 'split' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Logo/Illustration URL (Right Side)</label>
                  <input
                    type="url"
                    value={heroLogoUrl}
                    onChange={(e) => setHeroLogoUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Logo ili ilustracija koja će se prikazati na desnoj strani hero sekcije (u bijelom boxu)
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Info Cards (JSON)</label>
                  <textarea
                    value={heroInfoCards}
                    onChange={(e) => setHeroInfoCards(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder='[{"label":"START DATE","value":"Jul 10, 2027","icon":"calendar"},{"label":"LOCATION","value":"Zagreb, Croatia","icon":"map-pin"}]'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JSON array info kartica koje će se prikazati ispod naslova. Icons: calendar, map-pin, building, users, clock
                  </p>
                </div>
                </>
              )}
              </div>
            </div>
          </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                <TiptapEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Write your page content here..."
                  conferenceId={conferenceId}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use the toolbar to format text, add headings, lists, links, tables, videos, and more.
                </p>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Customize meta tags for search engines and social media sharing. If left empty, page title and description will be used.
              </p>
              <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Title</label>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Custom title for search engines (max 60 characters)"
                maxLength={60}
              />
              <p className="text-xs text-gray-500 mt-1">
                {metaTitle.length}/60 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description for search engines (max 160 characters)"
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {metaDescription.length}/160 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Open Graph Image URL</label>
              <input
                type="url"
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/og-image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Image shown when sharing on social media (recommended: 1200x630px)
              </p>
            </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom CSS (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add custom CSS styles for this page. Styles will be scoped to this page only.
              </p>
              <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">CSS Code</label>
            <textarea
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder=".my-custom-class { color: blue; }"
            />
            <p className="text-xs text-gray-500 mt-1">
              CSS will be injected into the page. Use specific selectors to avoid conflicts.
            </p>
          </div>
          </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Preview</h3>
                {conferenceSlug && slugPreview && published ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Your page is published and available at:
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <code className="text-sm text-blue-600 break-all">
                        /conferences/{conferenceSlug}/p/{slugPreview}
                      </code>
                    </div>
                    <Link
                      href={`/conferences/${conferenceSlug}/p/${slugPreview}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in New Tab
                    </Link>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      Page must be published to view preview. Enable "Published" checkbox in Basic tab and save.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button - Always visible */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-2">
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

