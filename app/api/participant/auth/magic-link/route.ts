import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema
const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
  redirect_to: z.string().url().optional(),
})

/**
 * POST /api/participant/auth/magic-link
 * Send magic link for passwordless login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = magicLinkSchema.parse(body)

    const supabase = await createServerClient()

    // Check if participant exists
    const { data: profile } = await supabase
      .from('participant_profiles')
      .select('id, email, has_account')
      .eq('email', validatedData.email)
      .single()

    if (!profile) {
      // Don't reveal if user exists or not for security
      log.warn('Magic link requested for non-existent participant', {
        email: validatedData.email,
      })
      return NextResponse.json({
        success: true,
        message:
          'If an account exists with this email, you will receive a login link.',
      })
    }

    if (!profile.has_account) {
      log.info('Magic link requested for guest participant', {
        email: validatedData.email,
      })
      return NextResponse.json({
        success: true,
        message:
          'This email is registered but does not have an account. Please create an account first.',
      })
    }

    // Send magic link
    const redirectTo =
      validatedData.redirect_to ||
      `${process.env.NEXT_PUBLIC_SITE_URL}/participant/dashboard`

    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: validatedData.email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (magicLinkError) {
      log.error('Failed to send magic link', magicLinkError, {
        email: validatedData.email,
      })
      return NextResponse.json(
        { error: 'Failed to send magic link' },
        { status: 500 }
      )
    }

    log.info('Magic link sent', {
      email: validatedData.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Please check your email.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    log.error('Magic link error', error as Error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
