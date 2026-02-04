import { NextRequest, NextResponse } from 'next/server'
import { requireCanImpersonate, requireSuperAdmin } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/impersonate
 * Super admin can impersonate a conference admin user
 * This allows super admin to see the dashboard as that user would see it
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      throw ApiError.validationError('User ID is required')
    }

    // ✅ Use centralized auth helper (checks super admin + target user validity)
    const { profile, supabase } = await requireCanImpersonate(userId)

    // Get the user to impersonate
    const { data: targetUser, error: targetError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      throw ApiError.notFound('User')
    }

    log.info('Impersonation started', {
      superAdminId: profile.id,
      superAdminEmail: profile.email,
      impersonatedUserId: userId,
      impersonatedUserEmail: targetUser.email,
    })

    // Return the target user's profile data
    // The client will use this to switch the view
    return NextResponse.json({
      success: true,
      impersonatedUser: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        role: targetUser.role,
        active: targetUser.active,
      },
      originalUser: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
      },
    })
  } catch (error) {
    return handleApiError(error, { action: 'impersonate' })
  }
}

/**
 * DELETE /api/admin/impersonate
 * Stop impersonation and return to super admin view
 */
export async function DELETE() {
  try {
    // ✅ Use centralized auth helper
    const { user, profile } = await requireSuperAdmin()

    log.info('Impersonation stopped', {
      superAdminId: user.id,
      superAdminEmail: profile.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Impersonation stopped',
    })
  } catch (error) {
    return handleApiError(error, { action: 'stop_impersonate' })
  }
}
