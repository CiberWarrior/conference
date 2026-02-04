import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/account
 * Get current user's account information
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ Use centralized auth helper
    const { user, profile, supabase } = await requireAuth()

    // Get subscription info
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        billing_cycle,
        price,
        currency,
        starts_at,
        expires_at,
        subscription_plans (
          name,
          slug
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      profile,
      subscription: subscription || null,
    })
  } catch (error) {
    return handleApiError(error, { action: 'get_account' })
  }
}

/**
 * PATCH /api/admin/account
 * Update current user's own profile
 * Users can only update their own profile (not others)
 */
export async function PATCH(request: NextRequest) {
  try {
    // ✅ Use centralized auth helper
    const { user, supabase } = await requireAuth()

    const body = await request.json()
    const { full_name, phone, organization } = body

    // Validate that user is updating their own profile
    // (This endpoint only allows updating own profile, so this is implicit)

    log.info('Updating own profile', {
      userId: user.id,
      action: 'update_own_profile',
    })

    // Build update object
    const profileUpdates: {
      updated_at: string
      full_name?: string
      phone?: string
      organization?: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (full_name !== undefined) profileUpdates.full_name = full_name
    if (phone !== undefined) profileUpdates.phone = phone
    if (organization !== undefined) profileUpdates.organization = organization

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(profileUpdates)
      .eq('id', user.id)

    if (updateError) {
      log.error('Profile update error', updateError, {
        userId: user.id,
        action: 'update_own_profile',
      })
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    log.info('Profile updated successfully', {
      userId: user.id,
      action: 'update_own_profile',
    })

    // Fetch updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      log.error('Error fetching updated profile', fetchError, {
        userId: user.id,
      })
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    return handleApiError(error, { action: 'update_own_profile' })
  }
}

