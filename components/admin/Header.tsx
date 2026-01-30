'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LogOut, ExternalLink, ChevronDown, CheckCircle, Shield, Users, X } from 'lucide-react'
import { useConference } from '@/contexts/ConferenceContext'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const router = useRouter()
  const t = useTranslations('admin.header')
  const tSidebar = useTranslations('admin.sidebar')
  const [loggingOut, setLoggingOut] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { currentConference, conferences, setCurrentConference } = useConference()
  const { isSuperAdmin, role, isImpersonating, impersonatedProfile, originalProfile, stopImpersonation } = useAuth()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/auth/admin-login')
        router.refresh()
      }
    } catch (error) {
      // Logout error - silently fail
    } finally {
      setLoggingOut(false)
    }
  }

  // Different header colors based on role
  const headerBorderColor = isSuperAdmin 
    ? 'border-yellow-200' 
    : 'border-slate-300'
  const headerGradient = isSuperAdmin
    ? 'from-yellow-600 to-yellow-500'
    : 'from-slate-700 to-slate-600'

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && impersonatedProfile && originalProfile && (
        <div className="bg-yellow-500 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">
              {t('viewingAs')} <span className="font-bold">{impersonatedProfile.full_name || impersonatedProfile.email}</span>
              {' '}({impersonatedProfile.email})
            </span>
            <span className="text-yellow-100 text-sm">
              • {t('original')} {originalProfile.full_name || originalProfile.email}
            </span>
          </div>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-2 px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-medium text-sm"
          >
            <X className="w-4 h-4" />
            {t('exitImpersonation')}
          </button>
        </div>
      )}
      <header className={`bg-white shadow-sm border-b-2 ${headerBorderColor}`}>
        <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          {role && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white border border-blue-400">
              {isSuperAdmin ? (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{tSidebar('superAdmin')}</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>{tSidebar('conferenceAdmin')}</span>
                </>
              )}
            </div>
          )}

          {/* Conference Switcher */}
          {conferences.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <span className="text-sm font-semibold text-gray-700">
                  {currentConference ? currentConference.name : t('selectConference')}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      {t('yourConferences', { count: conferences.length })}
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {conferences.map((conference) => (
                      <button
                        key={conference.id}
                        onClick={() => {
                          setCurrentConference(conference)
                          setDropdownOpen(false)
                          router.push('/admin/dashboard')
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{conference.name}</p>
                          {conference.location && (
                            <p className="text-xs text-gray-500 mt-1">{conference.location}</p>
                          )}
                        </div>
                        {currentConference?.id === conference.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="px-3 py-2 border-t border-gray-200 mt-2">
                    <Link
                      href="/admin/conferences"
                      onClick={() => setDropdownOpen(false)}
                      className="block text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {t('manageConferences')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentConference?.published && (
            <Link
              href={`/conferences/${currentConference.slug}`}
              target="_blank"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all font-medium border border-blue-200"
            >
              <ExternalLink className="w-4 h-4" />
              {t('viewConferenceSite')}
            </Link>
          )}
          <Link
            href="/admin/account"
            className="text-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t('account')}
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? t('loggingOut') : t('logout')}
          </button>
        </div>
      </div>
    </header>
    </>
  )
}

