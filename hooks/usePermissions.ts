/**
 * Custom hook for checking user permissions
 * SIMPLIFIED APPROACH:
 * - Super Admin: has all permissions
 * - Conference Admin: has all permissions for their assigned conferences
 * - Only Super Admin can edit conference settings and delete data
 * 
 * Note: For server-side permission checks, use async functions from auth-utils
 */

import { useAuth } from './useAuth'
import { useConference } from './useConference'
import { useMemo } from 'react'

export function usePermissions() {
  const { user, profile } = useAuth()
  const { currentConference } = useConference()

  // Memoize permission checks
  const permissions = useMemo(() => {
    if (!user || !profile) {
      return {
        isSuperAdmin: false,
        canViewRegistrations: false,
        canExportData: false,
        canManagePayments: false,
        canManageAbstracts: false,
        canCheckIn: false,
        canGenerateCertificates: false,
        canEditConference: false,
        canDeleteData: false,
        canManageRegistrationForm: false,
        canViewAllRegistrations: false,
        canViewAnalytics: false,
      }
    }

    // Super admin has all permissions
    const isAdmin = profile.role === 'super_admin' && profile.active === true

    // SIMPLIFIED: Conference admin has all permissions if they have a selected conference
    // If conference is selected, they already have access (checked by ConferenceContext/RLS)
    const hasConferenceAccess = isAdmin || (currentConference !== null)

    return {
      isSuperAdmin: isAdmin,
      // SIMPLIFIED: If user has conference access, they have all permissions for that conference
      canViewRegistrations: isAdmin || hasConferenceAccess,
      canExportData: isAdmin || hasConferenceAccess,
      canManagePayments: isAdmin || hasConferenceAccess,
      canManageAbstracts: isAdmin || hasConferenceAccess,
      canCheckIn: isAdmin || hasConferenceAccess,
      canGenerateCertificates: isAdmin || hasConferenceAccess,
      // New permissions
      canManageRegistrationForm: isAdmin || hasConferenceAccess,
      canViewAllRegistrations: isAdmin || hasConferenceAccess,
      canViewAnalytics: isAdmin || hasConferenceAccess,
      // RESTRICTED: Only Super Admin can edit conference settings and delete data
      canEditConference: isAdmin,
      canDeleteData: isAdmin,
    }
  }, [user, profile, currentConference])

  return permissions
}

