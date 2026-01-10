'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useConference } from '@/contexts/ConferenceContext'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  superAdminOnly?: boolean
  requiresPermission?: string
}

interface NavSection {
  title?: string
  items: NavItem[]
  superAdminOnly?: boolean
}

const navigationSections: NavSection[] = [
  {
    items: [
      {
        name: 'Dashboard',
        href: '/admin/dashboard',
        superAdminOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        name: 'My Account',
        href: '/admin/account',
        superAdminOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
    ]
  },
  {
    title: 'Conference Management',
    items: [
      {
        name: 'My Conferences',
        href: '/admin/conferences', // Will be overridden for Conference Admin in render
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
    ]
  },
  {
    title: 'System',
    superAdminOnly: true,
    items: [
      {
        name: 'Users',
        href: '/admin/users',
        superAdminOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
    ]
  },
  {
    title: 'Sales & Leads',
    superAdminOnly: true,
    items: [
      {
        name: 'Inquiries',
        href: '/admin/inquiries',
        superAdminOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
    ]
  },
  {
    items: [
      {
        name: 'Registrations',
        href: '/admin/registrations',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
      {
        name: 'Payments',
        href: '/admin/payments',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
    ]
  },
  {
    title: 'Tools',
    items: [
      {
        name: 'Check-In',
        href: '/admin/checkin',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        name: 'Certificates',
        href: '/admin/certificates',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ),
      },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { isSuperAdmin, role, loading: authLoading, profile } = useAuth()
  const { currentConference } = useConference()
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMounted(true)
    // Fetch user permissions if Conference Admin
    if (profile && profile.role === 'conference_admin') {
      // In simplified approach, Conference Admin has most permissions by default
      setUserPermissions({
        can_manage_registration_form: true,
        can_view_analytics: true,
      })
    }
  }, [profile])

  // Different sidebar colors based on role
  const sidebarBgColor = isSuperAdmin 
    ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
    : 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900'
  const sidebarBorderColor = isSuperAdmin 
    ? 'border-gray-700' 
    : 'border-slate-700'

  // Prevent hydration mismatch by not rendering active state until mounted
  const getIsActive = (href: string, itemName?: string) => {
    if (!mounted || !pathname) return false
    // For "My Conferences" when Conference Admin is on Dashboard
    if (itemName === 'My Conferences' && !isSuperAdmin && pathname === '/admin/dashboard') {
      return true
    }
    return pathname === href || (href !== '/admin' && href !== '/admin/dashboard' && pathname.startsWith(href))
  }

  // Filter sections based on user role
  const getFilteredSections = () => {
    if (authLoading) return []
    
    return navigationSections
      .filter(section => {
        // If section is superAdminOnly, only show to super admins
        if (section.superAdminOnly && !isSuperAdmin) return false
        return true
      })
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          // If item is superAdminOnly, only show to super admins
          if (item.superAdminOnly && !isSuperAdmin) return false
          // Check permission requirement
          if (item.requiresPermission) {
            // Super admin has all permissions
            if (isSuperAdmin) return true
            // Check if user has the specific permission
            return userPermissions[item.requiresPermission] === true
          }
          return true
        })
      }))
      .filter(section => section.items.length > 0) // Remove empty sections
  }

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className={`flex flex-col flex-grow pt-5 pb-4 overflow-y-auto ${sidebarBgColor} border-r ${sidebarBorderColor}`}>
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <Link href="/admin/dashboard" className="flex items-center">
              <div className={`w-8 h-8 ${isSuperAdmin ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'} rounded-lg flex items-center justify-center mr-3 shadow-lg`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">MeetFlow</span>
            </Link>
          </div>
          <div className="flex-1 flex flex-col">
            {authLoading ? (
              <div className="flex-1 px-2 py-4 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
              </div>
            ) : (
            <nav className="flex-1 px-2 space-y-3">
              {getFilteredSections().map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  {section.title && (
                    <div className="px-3 mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {section.title}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      // For Conference Admin, "My Conferences" should link to Dashboard
                      let href = item.href
                      
                      if (!isSuperAdmin && item.name === 'My Conferences') {
                        href = '/admin/dashboard'
                      }
                      
                      const isActive = getIsActive(href, item.name)
                      const activeBgColor = isSuperAdmin
                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                        : 'bg-gradient-to-r from-slate-700 to-slate-600'
                      const hoverBgColor = isSuperAdmin
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-slate-800'
                      
                      return (
                        <Link
                          key={item.name}
                          href={href}
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                            isActive
                              ? `${activeBgColor} text-white shadow-lg`
                              : `text-gray-300 ${hoverBgColor} hover:text-white`
                          }`}
                        >
                          <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                            {item.icon}
                          </span>
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
            )}
            
            {/* Role Badge */}
            {!authLoading && role && (
              <div className={`px-4 py-3 border-t ${isSuperAdmin ? 'border-gray-700' : 'border-slate-700'}`}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isSuperAdmin 
                    ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-500/30' 
                    : 'bg-gradient-to-r from-slate-700/30 to-slate-600/30 border border-slate-500/40'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    role === 'super_admin' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-slate-400 shadow-lg shadow-slate-400/50'
                  }`}></div>
                  <span className={`text-xs font-bold ${
                    role === 'super_admin' ? 'text-yellow-300' : 'text-slate-300'
                  }`}>
                    {role === 'super_admin' ? 'Super Admin' : 'Conference Admin'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
            <Link
              href="/"
              target="_blank"
              className="flex-shrink-0 w-full group block"
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    Homepage
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

