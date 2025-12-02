/**
 * Custom hook for checking user permissions
 * Note: For detailed permission checks, use async functions from auth-utils
 * This hook provides basic permission checks based on user profile
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
      }
    }

    // Super admin has all permissions
    const isAdmin = profile.role === 'super_admin' && profile.active === true

    // For conference admins, we assume they have permissions if they have a selected conference
    // Detailed permission checks should be done server-side using auth-utils functions
    const hasConferenceAccess = isAdmin || (currentConference !== null)

    return {
      isSuperAdmin: isAdmin,
      // Super admins have all permissions, conference admins have permissions if they have conference access
      canViewRegistrations: isAdmin || hasConferenceAccess,
      canExportData: isAdmin || hasConferenceAccess,
      canManagePayments: isAdmin || hasConferenceAccess,
      canManageAbstracts: isAdmin || hasConferenceAccess,
      canCheckIn: isAdmin || hasConferenceAccess,
      canGenerateCertificates: isAdmin || hasConferenceAccess,
      canEditConference: isAdmin, // Only super admins can edit conferences
      canDeleteData: isAdmin, // Only super admins can delete data
    }
  }, [user, profile, currentConference])

  return permissions
}

