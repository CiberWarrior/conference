import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { logUserActivity, getIpAddress, getUserAgent } from '@/lib/user-activity'

export const dynamic = 'force-dynamic'

/**
 * GET /auth/callback
 * Handle magic link callback from email
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/user/dashboard'

  if (token_hash && type) {
    const supabase = await createServerClient()

    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (error) {
      console.error('❌ OTP verification error:', error)
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_token', request.url)
      )
    }

    if (data.user) {
      // Check if user has registrations
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('id, email')
        .eq('email', data.user.email)
        .limit(1)
        .single()

      if (regError) {
        console.error('❌ Registration check error:', regError)
      }

      if (registration) {
        // Log the login activity
        try {
          await logUserActivity('login', {
            ipAddress: getIpAddress(request),
            userAgent: getUserAgent(request),
            details: { method: 'magic_link' },
          })
        } catch (error) {
          // Don't fail login if logging fails
          console.error('Failed to log login activity:', error)
        }

        // Redirect to user dashboard
        return NextResponse.redirect(new URL(next, request.url))
      } else {
        // User authenticated but has no registrations
        // Redirect to homepage
        return NextResponse.redirect(new URL('/?error=no_registration', request.url))
      }
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
}

