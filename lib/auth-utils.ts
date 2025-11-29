import { supabase } from './supabase'

export type UserRole = 'super_admin' | 'conference_admin'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  active: boolean
  phone: string | null
  organization: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface ConferencePermission {
  id: string
  user_id: string
  conference_id: string
  can_view_registrations: boolean
  can_export_data: boolean
  can_manage_payments: boolean
  can_manage_abstracts: boolean
  can_check_in: boolean
  can_generate_certificates: boolean
  can_edit_conference: boolean
  can_delete_data: boolean
  granted_by: string | null
  granted_at: string
  notes: string | null
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data as UserProfile
  } catch (error) {
    console.error('Error getting current user profile:', error)
    return null
  }
}

/**
 * Check if current user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const profile = await getCurrentUserProfile()
    return profile?.role === 'super_admin' && profile?.active === true
  } catch (error) {
    console.error('Error checking super admin status:', error)
    return false
  }
}

/**
 * Check if user has permission for specific conference
 */
export async function hasConferencePermission(
  conferenceId: string,
  userId?: string
): Promise<boolean> {
  try {
    // If super admin, has access to everything
    if (await isSuperAdmin()) {
      return true
    }

    const { data: { user } } = await supabase.auth.getUser()
    const checkUserId = userId || user?.id
    
    if (!checkUserId) return false

    const { data, error } = await supabase
      .from('conference_permissions')
      .select('id')
      .eq('user_id', checkUserId)
      .eq('conference_id', conferenceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return false // No rows found
      console.error('Error checking conference permission:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking conference permission:', error)
    return false
  }
}

/**
 * Get user's conference permissions
 */
export async function getUserConferencePermissions(
  conferenceId: string,
  userId?: string
): Promise<ConferencePermission | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const checkUserId = userId || user?.id
    
    if (!checkUserId) return null

    const { data, error } = await supabase
      .from('conference_permissions')
      .select('*')
      .eq('user_id', checkUserId)
      .eq('conference_id', conferenceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error fetching conference permissions:', error)
      return null
    }

    return data as ConferencePermission
  } catch (error) {
    console.error('Error getting conference permissions:', error)
    return null
  }
}

/**
 * Get all accessible conferences for current user
 */
export async function getAccessibleConferences() {
  try {
    const profile = await getCurrentUserProfile()
    
    if (!profile) return []

    // Super admin gets all conferences
    if (profile.role === 'super_admin') {
      const { data, error } = await supabase
        .from('conferences')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching conferences:', error)
        return []
      }

      return data || []
    }

    // Conference admin gets only assigned conferences
    const { data, error } = await supabase
      .from('conferences')
      .select(`
        *,
        conference_permissions!inner(user_id)
      `)
      .eq('conference_permissions.user_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching accessible conferences:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting accessible conferences:', error)
    return []
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

/**
 * Log admin action to audit trail
 */
export async function logAdminAction(
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
): Promise<void> {
  try {
    await supabase.rpc('log_admin_action', {
      p_action: action,
      p_resource_type: resourceType || null,
      p_resource_id: resourceId || null,
      p_details: details ? JSON.stringify(details) : null,
    })
  } catch (error) {
    console.error('Error logging admin action:', error)
  }
}

/**
 * Check specific permission for conference
 */
export async function checkPermission(
  conferenceId: string,
  permission: keyof Pick<
    ConferencePermission,
    | 'can_view_registrations'
    | 'can_export_data'
    | 'can_manage_payments'
    | 'can_manage_abstracts'
    | 'can_check_in'
    | 'can_generate_certificates'
    | 'can_edit_conference'
    | 'can_delete_data'
  >
): Promise<boolean> {
  try {
    // Super admin has all permissions
    if (await isSuperAdmin()) {
      return true
    }

    const permissions = await getUserConferencePermissions(conferenceId)
    
    if (!permissions) return false

    return permissions[permission] === true
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}


