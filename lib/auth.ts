import { createServerClient } from './supabase'

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
    console.error('Auth check error:', error)
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
    console.error('Get user error:', error)
    return null
  }
}

