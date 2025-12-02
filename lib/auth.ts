import { createServerClient } from './supabase'
import { log } from './logger'

/**
 * Check if user is authenticated
 * Uses Supabase Auth
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return false
    }

    // Check if user has active profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('active')
      .eq('id', user.id)
      .single()

    return profile?.active === true
  } catch (error) {
    log.error('Auth check error', error, {
      function: 'isAuthenticated',
    })
    return false
  }
}

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    log.error('Get user error', error, {
      function: 'getCurrentUser',
    })
    return null
  }
}

