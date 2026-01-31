'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Conference } from '@/types/conference'

interface ConferenceNavigationProps {
  conference: Conference
}

interface NavPage {
  id: string
  slug: string
  title: string
  sort_order: number
}

export default function ConferenceNavigation({
  conference,
}: ConferenceNavigationProps) {
  const t = useTranslations('register')
  const primaryColor = conference.primary_color || '#3B82F6'
  const [pages, setPages] = useState<NavPage[]>([])
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadPages = async () => {
      try {
        if (!conference.slug) return
        const res = await fetch(`/api/conferences/${conference.slug}/pages`, { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) setPages(data.pages || [])
      } catch {
        // Ignore navigation errors
      }
    }
    loadPages()
  }, [conference.slug])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMoreDropdown(false)
      }
    }
    if (showMoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreDropdown])

  const visiblePages = pages.slice(0, 3)
  const morePages = pages.slice(3)

  return (
    <nav
      className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 border-b border-gray-200/50 shadow-sm"
      style={
        conference.primary_color
          ? {
              borderColor: `${primaryColor}20`,
            }
          : {}
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Conference Name */}
          <div className="flex items-center gap-6">
            <Link
              href={`/conferences/${conference.slug}`}
              className="text-xl font-bold"
              style={{ color: primaryColor }}
            >
              {conference.name}
            </Link>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <Link
              href={`/conferences/${conference.slug}`}
              className="text-gray-700 hover:text-gray-900"
            >
              Home
            </Link>
            {conference.settings?.registration_enabled !== false && (
              <Link
                href={`/conferences/${conference.slug}/register`}
                className="text-gray-700 hover:text-gray-900"
              >
                {t('navLink')}
              </Link>
            )}
            {conference.settings?.abstract_submission_enabled !== false && (
              <Link
                href={`/conferences/${conference.slug}/submit-abstract`}
                className="text-gray-700 hover:text-gray-900"
              >
                Abstracts
              </Link>
            )}
            {visiblePages.length > 0 && (
              <>
                {visiblePages.map((p) => (
                  <Link
                    key={p.id}
                    href={`/conferences/${conference.slug}/p/${p.slug}`}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    {p.title}
                  </Link>
                ))}
                {morePages.length > 0 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                      className="text-gray-700 hover:text-gray-900 flex items-center gap-1"
                    >
                      More
                      <svg
                        className={`w-4 h-4 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showMoreDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        {morePages.map((p) => (
                          <Link
                            key={p.id}
                            href={`/conferences/${conference.slug}/p/${p.slug}`}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowMoreDropdown(false)}
                          >
                            {p.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}

