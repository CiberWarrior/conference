/**
 * Permission Guard Component
 * SIMPLIFIED APPROACH:
 * - Super Admin: automatic access
 * - Conference Admin: access if they have the conference assigned
 * - Only checks for edit_conference and delete_data specifically restrict to Super Admin
 */
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useConference } from '@/contexts/ConferenceContext'
import { checkPermission } from '@/lib/auth-utils'
import type { ConferencePermission } from '@/lib/auth-utils'
import { useRouter } from 'next/navigation'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: keyof Pick<
    ConferencePermission,
    | 'can_view_registrations'
    | 'can_export_data'
    | 'can_manage_payments'
    | 'can_manage_abstracts'
    | 'can_check_in'
    | 'can_generate_certificates'
    | 'can_edit_conference'
    | 'can_delete_data'
    | 'can_manage_registration_form'
    | 'can_view_all_registrations'
    | 'can_view_analytics'
  >
  fallback?: React.ReactNode
  requireConference?: boolean
}

export default function PermissionGuard({
  children,
  permission,
  fallback,
  requireConference = true,
}: PermissionGuardProps) {
  const { isSuperAdmin, loading: authLoading } = useAuth()
  const { currentConference, loading: conferenceLoading } = useConference()
  const [hasPermission, setHasPermission] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      // Super admin has all permissions
      if (isSuperAdmin) {
        setHasPermission(true)
        setChecking(false)
        return
      }

      // If conference is required but not selected
      if (requireConference && !currentConference) {
        setHasPermission(false)
        setChecking(false)
        return
      }

      // If specific permission is required
      if (permission && currentConference) {
        const hasAccess = await checkPermission(currentConference.id, permission)
        setHasPermission(hasAccess)
      } else {
        setHasPermission(true)
      }

      setChecking(false)
    }

    if (!authLoading && !conferenceLoading) {
      checkAccess()
    }
  }, [isSuperAdmin, currentConference, permission, authLoading, conferenceLoading, requireConference])

  // Show loading state
  if (authLoading || conferenceLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show fallback or default message if no permission
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            {requireConference && !currentConference
              ? 'Please select a conference to access this feature.'
              : 'You do not have permission to access this feature.'}
          </p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}


