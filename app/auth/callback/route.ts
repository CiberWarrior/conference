import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /auth/callback
 * Handles Supabase Auth callbacks including password reset
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/'

  // Handle password reset callback
  if (type === 'recovery') {
    // Redirect to reset password page with the token
    const redirectUrl = new URL('/auth/reset-password', request.url)
    if (code) {
      redirectUrl.searchParams.set('code', code)
    }
    redirectUrl.searchParams.set('type', 'recovery')
    return NextResponse.redirect(redirectUrl)
  }

  // Handle other auth callbacks (magic link, etc.)
  // User login (magic link) has been removed for regular users
  // Only admin users can access the system
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Ignore cookie setting errors
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Ignore cookie removal errors
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      log.error('Auth callback error', error, {
        action: 'auth_callback',
        type,
      })
      return NextResponse.redirect(new URL('/auth/admin-login?error=auth_failed', request.url))
    }

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, active')
        .eq('id', user.id)
        .single()

      if (profile && profile.active && (profile.role === 'super_admin' || profile.role === 'conference_admin')) {
        // Admin user - redirect to dashboard
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }
  }

  // Default: redirect to homepage or admin login
  return NextResponse.redirect(new URL('/auth/admin-login?message=login_disabled', request.url))
}

