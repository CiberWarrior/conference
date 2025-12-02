import { createServerClient } from './supabase'

/**
 * Log user activity to the database
 * This is a helper function to track what users do on the platform
 */
export async function logUserActivity(
  action: string,
  options?: {
    resourceType?: string
    resourceId?: string
    details?: any
    ipAddress?: string
    userAgent?: string
    sessionId?: string
  }
): Promise<void> {
  try {
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !user.email) {
      console.warn('Cannot log activity: No user session')
      return
    }

    // Insert activity log
    const { error } = await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        user_email: user.email,
        action,
        resource_type: options?.resourceType || null,
        resource_id: options?.resourceId || null,
        details: options?.details || null,
        ip_address: options?.ipAddress || null,
        user_agent: options?.userAgent || null,
        session_id: options?.sessionId || null,
      })

    if (error) {
      console.error('Failed to log user activity:', error)
    }
  } catch (error) {
    console.error('Error logging user activity:', error)
  }
}

/**
 * Get IP address from request headers
 */
export function getIpAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIp || 'unknown'
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown'
}

