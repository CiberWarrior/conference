import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/auth-utils'
import type { CreateConferenceInput } from '@/types/conference'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/conferences
 * Get all conferences for the current admin
 * RLS policies automatically filter based on user role and permissions
 */
export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // TEMPORARY: Skip auth check while debugging
    // Verify user is authenticated
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('📋 Fetching conferences (auth check temporarily disabled)')

    // RLS policies will automatically filter conferences based on:
    // - Super admins see all conferences
    // - Conference admins see only their assigned conferences
    const { data: conferences, error } = await supabase
      .from('conferences')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get conferences error:', error)
      return NextResponse.json({ error: 'Failed to fetch conferences' }, { status: 500 })
    }

    console.log(`✅ Found ${conferences?.length || 0} conferences`)
    return NextResponse.json({ conferences })
  } catch (error) {
    console.error('Get conferences error:', error)
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
    
    // Check if user is super admin
    const profile = await getCurrentUserProfile()
    
    if (!profile || profile.role !== 'super_admin') {
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
        console.error('Create conference error:', error)
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
      console.error('Create conference error:', error)
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
      console.error('Error creating permission:', permError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ conference }, { status: 201 })
  } catch (error) {
    console.error('Create conference error:', error)
    return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 })
  }
}

