import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  country: z.string().optional(),
  institution: z.string().optional(),
  marketing_consent: z.boolean().optional(),
})

/**
 * POST /api/participant/auth/signup
 * Create new participant account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    const supabase = await createServerClient()

    // Check if email already exists in participant_profiles
    const { data: existingProfile, error: checkError } = await supabase
      .from('participant_profiles')
      .select('id, email, has_account, phone, country, institution')
      .eq('email', validatedData.email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      log.error('Error checking existing participant', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing account' },
        { status: 500 }
      )
    }

    if (existingProfile && existingProfile.has_account) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/participant/dashboard`,
        data: {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
        },
      },
    })

    if (authError) {
      log.error('Participant signup - auth creation failed', authError, {
        email: validatedData.email,
      })
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // If participant profile already exists (guest), update it
    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('participant_profiles')
        .update({
          auth_user_id: authData.user.id,
          has_account: true,
          account_activated_at: new Date().toISOString(),
          phone: validatedData.phone || existingProfile.phone || null,
          country: validatedData.country || existingProfile.country || null,
          institution:
            validatedData.institution || existingProfile.institution || null,
          marketing_consent: validatedData.marketing_consent ?? false,
        })
        .eq('id', existingProfile.id)

      if (updateError) {
        log.error('Failed to update participant profile', updateError)
        // Don't fail the signup, profile can be updated later
      }

      log.info('Participant account activated', {
        participantId: existingProfile.id,
        email: validatedData.email,
      })
    } else {
      // Create new participant profile
      const { error: profileError } = await supabase
        .from('participant_profiles')
        .insert({
          auth_user_id: authData.user.id,
          email: validatedData.email,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          phone: validatedData.phone || null,
          country: validatedData.country || null,
          institution: validatedData.institution || null,
          has_account: true,
          account_activated_at: new Date().toISOString(),
          email_notifications: true,
          marketing_consent: validatedData.marketing_consent ?? false,
        })

      if (profileError) {
        log.error('Failed to create participant profile', profileError)
        // Profile will be created on first registration
      }

      log.info('New participant account created', {
        userId: authData.user.id,
        email: validatedData.email,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    log.error('Participant signup error', error as Error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
