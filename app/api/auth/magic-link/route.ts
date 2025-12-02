import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import {
  magicLinkRateLimit,
  getClientIP,
  checkRateLimit,
  createRateLimitHeaders,
} from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/magic-link
 * Send magic link to user's email for passwordless login
 * Rate limited: 3 attempts per hour per IP
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit(magicLinkRateLimit, ip)

    if (rateLimitResult && !rateLimitResult.success) {
      const retryAfter = Math.ceil(
        (rateLimitResult.reset - Date.now()) / 1000
      )
      log.warn('Rate limit exceeded for magic link', {
        ip,
        retryAfter,
        action: 'magic_link_rate_limit',
      })
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const body = await request.json()
    const { email } = body

    log.info('Magic link request', { email }) // Email will be masked automatically

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      log.error('Supabase not configured', undefined, {
        action: 'magic_link',
      })
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    const supabase = await createServerClient()

    // Check if user has any registrations
    log.debug('Checking registrations', { email: normalizedEmail })
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, email, first_name')
      .eq('email', normalizedEmail)
      .limit(1)
      .single()

    if (regError) {
      log.error('Registration check error', regError, {
        email: normalizedEmail,
        action: 'magic_link',
      })
    }

    if (!registration) {
      log.debug('No registration found', { email: normalizedEmail })
      // Don't reveal that user doesn't exist (security best practice)
      // Return success message anyway
      const headers = rateLimitResult
        ? createRateLimitHeaders(rateLimitResult)
        : {}
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, you will receive a login link.',
        },
        { headers }
      )
    }

    log.debug('Registration found', {
      registrationId: registration.id,
      email: normalizedEmail,
    })

    // Try to send magic link first - if user doesn't exist, Supabase will return error
    // Then we'll create the user
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
    log.debug('Sending magic link', { email: normalizedEmail, redirectUrl })
    
    let magicLinkError: any = null
    const { error: initialError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: false, // Don't auto-create
      },
    })

    magicLinkError = initialError

    // If user doesn't exist, create one first
    if (
      magicLinkError &&
      (magicLinkError.message?.includes('not found') ||
        magicLinkError.message?.includes('does not exist'))
    ) {
      log.info('Auth user not found, creating one', {
        email: normalizedEmail,
        registrationId: registration.id,
      })
      const adminClient = createAdminClient()

      const { error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: false, // Will be confirmed via magic link
        user_metadata: {
          first_name: registration.first_name,
          registration_id: registration.id,
        },
      })

      if (createError) {
        log.error('Failed to create auth user', createError, {
          email: normalizedEmail,
          registrationId: registration.id,
          action: 'magic_link',
        })
        return NextResponse.json(
          { error: 'Failed to send login link. Please try again.' },
          { status: 500 }
        )
      }

      log.info('Auth user created, retrying magic link', {
        email: normalizedEmail,
      })
      
      // Retry sending magic link
      const { error: retryError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      magicLinkError = retryError
    }

    // Check if there's still an error after creating user
    if (magicLinkError) {
      log.error('Magic link error', magicLinkError, {
        email: normalizedEmail,
        action: 'magic_link',
      })

      // Provide more specific error messages
      let errorMessage = 'Failed to send login link. Please try again.'

      if (magicLinkError.message?.includes('redirect_to')) {
        errorMessage =
          'Redirect URL is not configured. Please add it to Supabase Auth settings.'
      } else if (magicLinkError.message?.includes('email')) {
        errorMessage =
          'Email service is not configured. Please check Supabase email settings.'
      } else if (magicLinkError.message) {
        errorMessage = `Error: ${magicLinkError.message}`
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details:
            process.env.NODE_ENV === 'development'
              ? magicLinkError.message
              : undefined,
        },
        { status: 500 }
      )
    }

    log.info('Magic link sent successfully', { email: normalizedEmail })

    const headers = rateLimitResult
      ? createRateLimitHeaders(rateLimitResult)
      : {}

    return NextResponse.json(
      {
        success: true,
        message: 'Check your email for a login link. The link will expire in 1 hour.',
      },
      { headers }
    )
  } catch (error) {
    log.error('Magic link catch error', error, {
      action: 'magic_link',
    })
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

