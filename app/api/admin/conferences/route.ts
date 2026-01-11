import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { CreateConferenceInput } from '@/types/conference'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/conferences
 * Get all conferences for the current admin
 * RLS policies automatically filter based on user role and permissions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      log.warn('Unauthorized access attempt to GET /api/admin/conferences', {
        action: 'get_conferences',
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    log.debug('Fetching conferences for user', {
      userId: user.id,
      action: 'get_conferences',
    })

    // Check if impersonating (from query param)
    const requestUrl = new URL(request.url)
    const impersonateUserId = requestUrl.searchParams.get('impersonate_user_id')
    
    let targetUserId = user.id
    let isImpersonating = false

    if (impersonateUserId && profile.role === 'super_admin') {
      // Verify the user to impersonate exists and is conference_admin
      const { data: targetUser } = await supabase
        .from('user_profiles')
        .select('role, active')
        .eq('id', impersonateUserId)
        .single()

      if (targetUser && targetUser.role === 'conference_admin' && targetUser.active) {
        targetUserId = impersonateUserId
        isImpersonating = true
        log.info('Impersonation active for conferences', {
          superAdminId: user.id,
          impersonatedUserId: targetUserId,
        })
      }
    }

    // RLS policies will automatically filter conferences based on:
    // - Super admins see all conferences
    // - Conference admins see only their assigned conferences
    // When impersonating, we need to manually filter for the impersonated user
    let conferencesQuery = supabase
      .from('conferences')
      .select('*')

    if (isImpersonating) {
      // When impersonating, only show conferences assigned to the impersonated user
      const { data: permissions } = await supabase
        .from('conference_permissions')
        .select('conference_id')
        .eq('user_id', targetUserId)

      const conferenceIds = permissions?.map(p => p.conference_id) || []
      
      if (conferenceIds.length > 0) {
        conferencesQuery = conferencesQuery.in('id', conferenceIds)
      } else {
        // No conferences assigned, return empty array
        return NextResponse.json({ conferences: [] })
      }
    }

    const { data: conferences, error } = await conferencesQuery
      .order('created_at', { ascending: false })

    if (error) {
      log.error('Get conferences error', error, {
        userId: user.id,
        action: 'get_conferences',
      })
      return NextResponse.json({ error: 'Failed to fetch conferences' }, { status: 500 })
    }

    log.info('Conferences fetched successfully', {
      userId: user.id,
      count: conferences?.length || 0,
      action: 'get_conferences',
    })
    return NextResponse.json({ conferences })
  } catch (error) {
    log.error('Get conferences error', error, {
      action: 'get_conferences',
    })
    return NextResponse.json({ error: 'Failed to fetch conferences' }, { status: 500 })
  }
}

/**
 * POST /api/admin/conferences
 * Create a new conference (Super Admin only)
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
      return NextResponse.json(
        { error: 'Unauthorized. Only super admins can create conferences.' },
        { status: 403 }
      )
    }

    const body: CreateConferenceInput = await request.json()

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Conference name is required' }, { status: 400 })
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('conferences')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      // Add random suffix to make it unique
      const randomSuffix = Math.random().toString(36).substring(2, 6)
      const uniqueSlug = `${slug}-${randomSuffix}`
      
      const { data: conference, error } = await supabase
        .from('conferences')
        .insert({
          name: body.name,
          slug: uniqueSlug,
          description: body.description,
          start_date: body.start_date,
          end_date: body.end_date,
          location: body.location,
          venue: body.venue,
          website_url: body.website_url,
          pricing: body.pricing || undefined,
          settings: body.settings || undefined,
          owner_id: 'admin', // For now, all conferences owned by single admin
        })
        .select()
        .single()

      if (error) {
        log.error('Create conference error', error, {
          userId: profile.id,
          conferenceName: body.name,
          action: 'create_conference',
        })
        return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 })
      }

      return NextResponse.json({ conference }, { status: 201 })
    }

    // Create conference with generated slug
    const { data: conference, error } = await supabase
      .from('conferences')
      .insert({
        name: body.name,
        slug,
        description: body.description,
        start_date: body.start_date,
        end_date: body.end_date,
        location: body.location,
        venue: body.venue,
        website_url: body.website_url,
        pricing: body.pricing || undefined,
        settings: body.settings || undefined,
        owner_id: profile.id, // Set super admin as owner
      })
      .select()
      .single()

    if (error) {
      log.error('Create conference error', error, {
        userId: profile.id,
        conferenceName: body.name,
        action: 'create_conference',
      })
      return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 })
    }

    // Auto-create permission for the creator (super admin)
    const { error: permError } = await supabase
      .from('conference_permissions')
      .insert({
        user_id: profile.id,
        conference_id: conference.id,
        can_view_registrations: true,
        can_export_data: true,
        can_manage_payments: true,
        can_manage_abstracts: true,
        can_check_in: true,
        can_generate_certificates: true,
        can_edit_conference: true,
        can_delete_data: true,
        granted_by: profile.id,
      })

    if (permError) {
      log.error('Error creating permission', permError, {
        userId: profile.id,
        conferenceId: conference.id,
        action: 'create_conference_permission',
      })
      // Don't fail the request, just log the error
    }

    log.info('Conference created successfully', {
      userId: profile.id,
      conferenceId: conference.id,
      conferenceName: conference.name,
      action: 'create_conference',
    })
    return NextResponse.json({ conference }, { status: 201 })
  } catch (error) {
    log.error('Create conference error', error, {
      action: 'create_conference',
    })
    return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 })
  }
}

