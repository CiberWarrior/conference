'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Globe } from 'lucide-react'
import type { Conference } from '@/types/conference'

interface ConferenceFooterProps {
  conference: Conference
}

export default function ConferenceFooter({
  conference,
}: ConferenceFooterProps) {
  const primaryColor = conference.primary_color || '#1e3a8a' // Dark blue default

  return (
    <footer className="bg-gray-900 text-white border-t-4" style={{ borderTopColor: primaryColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Conference Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">{conference.name}</h3>
            {conference.description && (
              <p className="text-blue-100 text-sm mb-4 line-clamp-3 leading-relaxed">
                {conference.description}
              </p>
            )}
            {conference.website_url && (
              <a
                href={conference.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors font-medium"
              >
                <Globe className="w-4 h-4" />
                Visit Website
              </a>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-3 text-sm">
              {conference.location && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                  <span className="text-blue-100">{conference.location}</span>
                </li>
              )}
              {conference.venue && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                  <span className="text-blue-100">{conference.venue}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/conferences/${conference.slug}`}
                  className="text-blue-100 hover:text-white transition-colors inline-block"
                >
                  Conference Home
                </Link>
              </li>
              {conference.settings?.registration_enabled !== false && (
                <li>
                  <Link
                    href={`/conferences/${conference.slug}/register`}
                    className="text-blue-100 hover:text-white transition-colors inline-block"
                  >
                    Register
                  </Link>
                </li>
              )}
              {conference.settings?.abstract_submission_enabled !== false && (
                <li>
                  <Link
                    href={`/conferences/${conference.slug}/submit-abstract`}
                    className="text-blue-100 hover:text-white transition-colors inline-block"
                  >
                    Submit Abstract
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/"
                  className="text-blue-100 hover:text-white transition-colors inline-block"
                >
                  Platform Home
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-blue-200">
              © {new Date().getFullYear()} {conference.name}. All rights
              reserved.
            </p>
            <p className="text-sm text-blue-200">
              Powered by{' '}
              <Link href="/" className="hover:text-white transition-colors font-medium">
                MeetFlow
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  )
}

