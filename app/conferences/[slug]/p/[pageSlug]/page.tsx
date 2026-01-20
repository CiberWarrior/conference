'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { sanitizeHtml } from '@/utils/sanitize-html'
import type { ConferencePage } from '@/types/conference-page'

export default function ConferenceCustomPage() {
  const params = useParams()
  const slug = params?.slug as string
  const pageSlug = params?.pageSlug as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conferenceName, setConferenceName] = useState<string>('')
  const [page, setPage] = useState<ConferencePage | null>(null)
  const [domPurifyLoaded, setDomPurifyLoaded] = useState(false)
  const [sanitizedContent, setSanitizedContent] = useState<string>('')

  // Load DOMPurify on client-side
  useEffect(() => {
    const loadDOMPurify = async () => {
      try {
        const DOMPurify = (await import('dompurify')).default
        ;(window as any).DOMPurify = DOMPurify
        console.log('DOMPurify loaded successfully')
        setDomPurifyLoaded(true)
      } catch (err) {
        console.warn('Failed to load DOMPurify:', err)
        // Continue without DOMPurify - sanitizeHtml will use fallback
        setDomPurifyLoaded(true)
      }
    }
    loadDOMPurify()
  }, [])

  useEffect(() => {
    if (!slug || !pageSlug || !domPurifyLoaded) return

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/conferences/${slug}/pages/${pageSlug}`, {
          cache: 'no-store',
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to load page' }))
          console.error('API error:', res.status, errorData)
          throw new Error(errorData.error || errorData.details || 'Page not found')
        }
        
        const data = await res.json()

        setConferenceName(data.conference?.name || '')
        setPage(data.page)
        
        // Debug: log content to see if it contains images
        if (data.page?.content) {
          console.log('Page content loaded:', data.page.content)
          console.log('Contains img tag:', data.page.content.includes('<img'))
          
          // Extract image URLs for debugging
          const imgMatches = data.page.content.match(/<img[^>]+src="([^"]+)"/g)
          if (imgMatches) {
            console.log('Found image tags:', imgMatches)
            imgMatches.forEach((match: string, idx: number) => {
              const srcMatch = match.match(/src="([^"]+)"/)
              if (srcMatch) {
                console.log(`Image ${idx + 1} URL:`, srcMatch[1])
              }
            })
          }
          
          // Sanitize content now that DOMPurify is loaded
          const sanitized = sanitizeHtml(data.page.content)
          console.log('Sanitized content:', sanitized.substring(0, 500))
          console.log('Sanitized contains img:', sanitized.includes('<img'))
          setSanitizedContent(sanitized)
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load page')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug, pageSlug, domPurifyLoaded])

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href={slug ? `/conferences/${slug}` : '/'}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          Back to conference
        </Link>
      </main>
    )
  }

  if (!page) return null

  const hasHero = !!(page.hero_subtitle || page.hero_image_url || page.hero_background_color)

  return (
    <main>
      {/* Hero Section */}
      {hasHero && (
        <section
          className="relative py-16 md:py-24 text-white overflow-hidden"
          style={{
            backgroundColor: page.hero_background_color || '#3B82F6',
            backgroundImage: page.hero_image_url ? `url(${page.hero_image_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {page.hero_image_url && (
            <div className="absolute inset-0 bg-black/40" />
          )}
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
              {page.title}
            </h1>
            {page.hero_subtitle && (
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                {page.hero_subtitle}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!hasHero && (
          <div className="mb-8">
            <Link
              href={`/conferences/${slug}`}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← Back to {conferenceName || 'conference'}
            </Link>
          </div>
        )}

        {!hasHero && (
          <h1 className="text-4xl font-black text-gray-900 mb-6">{page.title}</h1>
        )}

        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: sanitizedContent || sanitizeHtml(page.content || '')
          }}
        />
        <style jsx global>{`
          /* Ensure images are visible and properly styled */
          .prose img,
          .prose p img,
          .prose figure img {
            max-width: 100% !important;
            height: auto !important;
            border-radius: 0.5rem;
            margin: 2rem auto !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          /* Remove any prose styles that might hide images */
          .prose img[src] {
            display: block !important;
          }
        `}</style>
      </div>
    </main>
  )
}

