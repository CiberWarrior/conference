import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import type { UpdateConferenceInput } from '@/types/conference'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/conferences/[id]
 * Get a single conference by ID
 * Requires authentication - RLS policies will filter based on user permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // ✅ SECURITY: Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // RLS policies will automatically filter based on user permissions
    // Super admins see all conferences
    // Conference admins see only their assigned conferences
    const { data: conference, error } = await supabase
      .from('conferences')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !conference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    // Return with no-cache headers to prevent caching issues
    return NextResponse.json(
      { conference },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    log.error('Get conference error', error, {
      conferenceId: params.id,
      action: 'get',
    })
    return NextResponse.json({ error: 'Failed to fetch conference' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/conferences/[id]
 * Update a conference
 * Requires authentication and authorization
 * Super admins can update any conference
 * Conference admins can only update conferences they have permission for
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ SECURITY: First verify user is authenticated using server client
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ SECURITY: Get user profile to check permissions
    const { data: profile, error: profileError } = await serverSupabase
      .from('user_profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      )
    }

    if (!profile.active) {
      return NextResponse.json(
        { error: 'Your account is deactivated' },
        { status: 403 }
      )
    }

    // ✅ SECURITY: Check if user has permission to update this conference
    // Super admins can update any conference
    // Conference admins can only update their assigned conferences with can_edit_conference permission
    if (profile.role !== 'super_admin') {
      const { data: permission } = await serverSupabase
        .from('conference_permissions')
        .select('can_edit_conference')
        .eq('user_id', user.id)
        .eq('conference_id', params.id)
        .single()
      
      if (!permission || !permission.can_edit_conference) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to update this conference.' },
          { status: 403 }
        )
      }
    }

    // Now safe to use admin client to bypass RLS policies for updates
    const supabase = createAdminClient()
    const body: Partial<UpdateConferenceInput> = await request.json()

    // Remove id from body if present (we use params.id)
    delete body.id

    log.info('Updating conference', {
      conferenceId: params.id,
      userId: user.id,
      userRole: profile.role,
    })
    log.debug('Update data', { data: body })

    // Update conference
    const { data: conference, error } = await supabase
      .from('conferences')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      log.error('Conference update failed', error, {
        conferenceId: params.id,
        userId: user.id,
        action: 'update',
      })
      return NextResponse.json({ 
        error: 'Failed to update conference',
        details: error.message 
      }, { status: 500 })
    }

    log.info('Conference updated successfully', {
      conferenceId: params.id,
      userId: user.id,
    })

    // Return with no-cache headers to prevent caching issues
    return NextResponse.json(
      { conference },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    log.error('Conference update error', error, {
      conferenceId: params.id,
      action: 'update',
    })
    return NextResponse.json({ 
      error: 'Failed to update conference',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/conferences/[id]
 * Delete a conference
 * WARNING: This will cascade delete all related data (registrations, abstracts, etc.)
 * Only super admins can delete conferences
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // ✅ SECURITY: Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ SECURITY: Get user profile to check role - only super admins can delete
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      )
    }

    if (!profile.active) {
      return NextResponse.json(
        { error: 'Your account is deactivated' },
        { status: 403 }
      )
    }

    if (profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only super admins can delete conferences.' },
        { status: 403 }
      )
    }

    // Check if conference exists
    const { data: conference, error: fetchError } = await supabase
      .from('conferences')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (fetchError || !conference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    // Use admin client to delete (bypasses RLS)
    const adminSupabase = createAdminClient()
    
    // Delete conference (will cascade delete all related data)
    const { error: deleteError } = await adminSupabase
      .from('conferences')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      log.error('Conference delete failed', deleteError, {
        conferenceId: params.id,
        userId: user.id,
        action: 'delete',
      })
      return NextResponse.json({ error: 'Failed to delete conference' }, { status: 500 })
    }

    log.info('Conference deleted successfully', {
      conferenceId: params.id,
      conferenceName: conference.name,
      userId: user.id,
      action: 'delete',
    })

    return NextResponse.json({
      success: true,
      message: `Conference "${conference.name}" and all related data deleted successfully`,
    })
  } catch (error) {
    log.error('Conference delete error', error, {
      conferenceId: params.id,
      action: 'delete',
    })
    return NextResponse.json({ error: 'Failed to delete conference' }, { status: 500 })
  }
}

