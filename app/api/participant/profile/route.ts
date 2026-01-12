import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema for profile updates
const updateProfileSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  institution: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
  email_notifications: z.boolean().optional(),
  marketing_consent: z.boolean().optional(),
  profile_data: z.record(z.any()).optional(),
})

/**
 * GET /api/participant/profile
 * Get current participant profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get participant profile
    const { data: profile, error: profileError } = await supabase
      .from('participant_profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile) {
      log.error('Participant profile not found', profileError, {
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    log.error('Get participant profile error', error as Error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/participant/profile
 * Update participant profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current profile
    const { data: currentProfile, error: getError } = await supabase
      .from('participant_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (getError || !currentProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('participant_profiles')
      .update(validatedData)
      .eq('id', currentProfile.id)
      .select()
      .single()

    if (updateError) {
      log.error('Failed to update participant profile', updateError, {
        participantId: currentProfile.id,
      })
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    log.info('Participant profile updated', {
      participantId: currentProfile.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    log.error('Update participant profile error', error as Error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
