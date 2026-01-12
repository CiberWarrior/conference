import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * POST /api/participant/auth/login
 * Participant login with email/password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const supabase = await createServerClient()

    // Attempt to sign in
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

    if (authError) {
      log.warn('Participant login failed', {
        email: validatedData.email,
        error: authError.message,
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Login failed' }, { status: 401 })
    }

    // Get participant profile
    const { data: profile, error: profileError } = await supabase
      .from('participant_profiles')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single()

    if (profileError || !profile) {
      log.error('Participant profile not found after login', profileError, {
        userId: authData.user.id,
        email: validatedData.email,
      })

      // Sign out and return error
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          error:
            'Participant profile not found. Please contact support or sign up again.',
        },
        { status: 403 }
      )
    }

    // Update last login
    await supabase
      .from('participant_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profile.id)

    log.info('Participant login successful', {
      participantId: profile.id,
      email: profile.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      profile: {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        loyalty_tier: profile.loyalty_tier,
        loyalty_points: profile.loyalty_points,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    log.error('Participant login error', error as Error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
