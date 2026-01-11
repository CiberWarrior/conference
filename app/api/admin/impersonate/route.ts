import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/impersonate
 * Super admin can impersonate a conference admin user
 * This allows super admin to see the dashboard as that user would see it
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile || profile.role !== 'super_admin') {
      log.warn('Unauthorized impersonation attempt', {
        userId: user.id,
        role: profile?.role,
      })
      return NextResponse.json(
        { error: 'Unauthorized. Only super admins can impersonate users.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get the user to impersonate
    const { data: targetUser, error: targetError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      log.error('User not found for impersonation', targetError, {
        targetUserId: userId,
        requestedBy: user.id,
      })
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only allow impersonating conference_admin users
    if (targetUser.role !== 'conference_admin') {
      log.warn('Attempt to impersonate non-conference-admin user', {
        targetUserId: userId,
        targetRole: targetUser.role,
        requestedBy: user.id,
      })
      return NextResponse.json(
        { error: 'Can only impersonate conference admin users' },
        { status: 403 }
      )
    }

    // Check if target user is active
    if (!targetUser.active) {
      return NextResponse.json(
        { error: 'Cannot impersonate inactive user' },
        { status: 403 }
      )
    }

    log.info('Impersonation started', {
      superAdminId: user.id,
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
    log.error('Impersonation error', error, {
      action: 'impersonate',
    })
    return NextResponse.json(
      { error: 'An error occurred during impersonation' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/impersonate
 * Stop impersonation and return to super admin view
 */
export async function DELETE() {
  try {
    const supabase = await createServerClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    log.info('Impersonation stopped', {
      superAdminId: user.id,
      superAdminEmail: profile.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Impersonation stopped',
    })
  } catch (error) {
    log.error('Stop impersonation error', error, {
      action: 'stop_impersonate',
    })
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
