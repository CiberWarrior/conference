'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Building2, Users, Clock } from 'lucide-react'
import { sanitizeHtml } from '@/utils/sanitize-html'
import PageShareButtons from '@/components/conference/PageShareButtons'
import type { ConferencePage } from '@/types/conference-page'

// Helper function to get icon component
function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    calendar: Calendar,
    'map-pin': MapPin,
    building: Building2,
    users: Users,
    clock: Clock,
  }
  return icons[iconName.toLowerCase()] || null
}

export default function ConferenceCustomPage() {
  const params = useParams()
  const slug = params?.slug as string
  const pageSlug = params?.pageSlug as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conference, setConference] = useState<any>(null)
  const [page, setPage] = useState<ConferencePage | null>(null)
  const [domPurifyLoaded, setDomPurifyLoaded] = useState(false)
  const [sanitizedContent, setSanitizedContent] = useState<string>('')
  const [pageUrl, setPageUrl] = useState('')

  // Load DOMPurify on client-side
  useEffect(() => {
    const loadDOMPurify = async () => {
      try {
        const DOMPurify = (await import('dompurify')).default
        ;(window as any).DOMPurify = DOMPurify
        setDomPurifyLoaded(true)
      } catch (err) {
        console.warn('Failed to load DOMPurify:', err)
        // Continue without DOMPurify - sanitizeHtml will use fallback
        setDomPurifyLoaded(true)
      }
    }
    loadDOMPurify()
  }, [])

  // Set page URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href)
    }
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
        
        // Check if response is JSON
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('API returned non-JSON response:', {
            status: res.status,
            contentType,
            preview: text.substring(0, 200)
          })
          throw new Error('Server returned invalid response. Please check the API endpoint.')
        }
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to load page' }))
          console.error('API error:', res.status, errorData)
          throw new Error(errorData.error || errorData.details || 'Page not found')
        }
        
        const data = await res.json()

        setConference(data.conference || null)
        setPage(data.page)
        
        // Update meta tags
        if (data.page) {
          const pageTitle = data.page.meta_title || data.page.title
          const pageDescription = data.page.meta_description || `Page from ${data.conference?.name || 'conference'}`
          const ogImage = data.page.og_image_url || data.page.hero_image_url || ''
          
          // Update document title
          document.title = pageTitle
          
          // Update or create meta tags
          const updateMetaTag = (name: string, content: string, isProperty = false) => {
            const attr = isProperty ? 'property' : 'name'
            let meta = document.querySelector(`meta[${attr}="${name}"]`)
            if (!meta) {
              meta = document.createElement('meta')
              meta.setAttribute(attr, name)
              document.head.appendChild(meta)
            }
            meta.setAttribute('content', content)
          }
          
          updateMetaTag('description', pageDescription)
          updateMetaTag('og:title', pageTitle, true)
          updateMetaTag('og:description', pageDescription, true)
          updateMetaTag('og:type', 'website', true)
          if (ogImage) {
            updateMetaTag('og:image', ogImage, true)
          }
          updateMetaTag('twitter:card', 'summary_large_image')
          updateMetaTag('twitter:title', pageTitle)
          updateMetaTag('twitter:description', pageDescription)
          if (ogImage) {
            updateMetaTag('twitter:image', ogImage)
          }
        }
        
        // Sanitize content now that DOMPurify is loaded
        if (data.page?.content) {
          setSanitizedContent(sanitizeHtml(data.page.content))
        } else {
          setSanitizedContent('')
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

  // Check if hero should be displayed
  // Hero is displayed if:
  // 1. Layout type is 'split' (always show split layout if selected)
  // 2. OR any other hero field is set
  const heroLayoutType = page.hero_layout_type || 'centered'
  const hasHero = heroLayoutType === 'split' || !!(
    page.hero_subtitle || 
    page.hero_image_url || 
    page.hero_background_color || 
    page.hero_logo_url ||
    page.hero_info_cards
  )
  const pageTitle = page.meta_title || page.title
  const conferenceName = conference?.name || ''
  const pageDescription = page.meta_description || `Page from ${conferenceName || 'conference'}`
  
  // Parse info cards
  let infoCards: Array<{ label: string; value: string; icon?: string }> = []
  if (page.hero_info_cards) {
    try {
      if (typeof page.hero_info_cards === 'string') {
        infoCards = JSON.parse(page.hero_info_cards)
      } else if (Array.isArray(page.hero_info_cards)) {
        infoCards = page.hero_info_cards
      } else if (typeof page.hero_info_cards === 'object') {
        infoCards = [page.hero_info_cards]
      }
    } catch (e) {
      console.warn('Failed to parse hero_info_cards:', e, page.hero_info_cards)
    }
  }

  // Smart defaults: if split hero is enabled but no cards are configured, generate
  // a sensible set from conference fields (location, venue, dates).
  if (heroLayoutType === 'split' && infoCards.length === 0 && conference) {
    const generated: Array<{ label: string; value: string; icon?: string }> = []

    const startDate = conference?.start_date ? new Date(conference.start_date) : null
    if (startDate && !Number.isNaN(startDate.getTime())) {
      generated.push({
        label: 'START DATE',
        value: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        icon: 'calendar',
      })
    }
    if (conference?.location) {
      generated.push({ label: 'LOCATION', value: String(conference.location), icon: 'map-pin' })
    }
    if (conference?.venue) {
      generated.push({ label: 'VENUE', value: String(conference.venue), icon: 'building' })
    }

    infoCards = generated
  }

  return (
    <>
      {/* Custom CSS */}
      {page.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: page.custom_css }} />
      )}
      <main>
        {/* Hero Section */}
        {hasHero && heroLayoutType === 'split' ? (
          // Split layout (like homepage)
          <section
            className="relative py-8 md:py-12 text-white overflow-hidden"
            style={{
              background: page.hero_background_color 
                ? `linear-gradient(to bottom right, ${page.hero_background_color}, ${page.hero_background_color}dd, ${page.hero_background_color}99)`
                : 'linear-gradient(to bottom right, #DC2626, #991B1B, #7F1D1D)',
            }}
          >
            {/* Geometric pattern background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`grid-${page.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#grid-${page.id})`} />
                </svg>
              </div>
              
              {/* Gradient orbs */}
              <div className="absolute top-1/4 left-[5%] w-64 h-64 bg-white/5 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-1/4 right-[5%] w-80 h-80 bg-white/5 rounded-full filter blur-3xl"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                {/* Left side - Text content */}
                <div className="text-left">
                  {/* Main Title */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight text-white">
                    {page.title}
                  </h1>

                  {/* Subtitle */}
                  {page.hero_subtitle && (
                    <p className="text-lg md:text-xl mb-6 text-white/90 leading-relaxed">
                      {page.hero_subtitle}
                    </p>
                  )}

                  {/* Info Cards */}
                  {infoCards.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {infoCards.map((card, idx) => {
                        const IconComponent = getIconComponent(card.icon || '')
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
                          >
                            {IconComponent && <IconComponent className="w-5 h-5 text-white" />}
                            <div>
                              <div className="text-xs text-white/80 font-semibold uppercase tracking-wide">
                                {card.label}
                              </div>
                              <div className="font-bold text-white text-sm">{card.value}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Right side - Logo box */}
                {page.hero_logo_url || conference?.logo_url ? (
                  <div className="flex justify-center md:justify-end">
                    <div className="p-10 md:p-12 rounded-3xl bg-white shadow-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.hero_logo_url || conference?.logo_url}
                        alt={page.title}
                        className="max-h-64 md:max-h-80 mx-auto"
                      />
                    </div>
                  </div>
                ) : (
                  // Placeholder if no logo is set
                  <div className="flex justify-center md:justify-end">
                    <div className="p-10 md:p-12 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <p className="text-white/60 text-sm text-center">Add logo URL in admin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : hasHero ? (
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
        ) : null}

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

          {/* Share Buttons */}
          <div className="mb-8">
            <PageShareButtons
              title={pageTitle}
              url={pageUrl}
              description={pageDescription}
            />
          </div>

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
    </>
  )
}

