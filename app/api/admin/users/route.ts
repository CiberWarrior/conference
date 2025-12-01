import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users
 * Get all users (Super Admin only)
 */
export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ GET /api/admin/users - No authenticated user')
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
      console.log('❌ GET /api/admin/users - User is not super admin')
      return NextResponse.json(
        { error: 'Unauthorized. Only super admins can view users.' },
        { status: 403 }
      )
    }

    console.log('📋 Fetching all users for super admin:', profile.email)

    // Get all user profiles with their conference assignments
    // Use explicit relationship to avoid ambiguity (user_id foreign key, not granted_by)
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        conference_permissions!conference_permissions_user_id_fkey (
          conference_id,
          conferences (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get users error:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Transform data to include conference count and names
    const usersWithConferences = users?.map(user => ({
      ...user,
      assigned_conferences_count: user.conference_permissions?.length || 0,
      assigned_conferences: user.conference_permissions?.map((cp: any) => ({
        id: cp.conference_id,
        name: cp.conferences?.name || 'Unknown'
      })) || []
    })) || []

    console.log(`✅ Found ${usersWithConferences.length} users`)
    
    return NextResponse.json({ users: usersWithConferences })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Create a new Conference Admin user (Super Admin only)
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
        { error: 'Unauthorized. Only super admins can create users.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      email, 
      password, 
      full_name, 
      phone, 
      organization,
      role = 'conference_admin',
      conference_ids = [],
      permissions = {}
    } = body

    console.log('👤 Creating new user:', { email, role, conference_ids })

    // Validate required fields
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth using Admin Client (requires SERVICE_ROLE_KEY)
    const adminClient = createAdminClient()
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name
      }
    })

    if (createAuthError) {
      console.error('Auth creation error:', createAuthError)
      return NextResponse.json(
        { error: createAuthError.message || 'Failed to create user in authentication system' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    console.log('✅ User created in Auth:', authData.user.id)

    // Create user profile
    const { error: createProfileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
        phone: phone || null,
        organization: organization || null,
        active: true
      })

    if (createProfileError) {
      console.error('Profile creation error:', createProfileError)
      
      // Rollback: Delete the auth user using Admin Client
      await adminClient.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    console.log('✅ User profile created')

    // If Conference Admin, assign conferences with permissions
    if (role === 'conference_admin' && conference_ids.length > 0) {
      const conferencePermissions = conference_ids.map((conferenceId: string) => ({
        user_id: authData.user.id,
        conference_id: conferenceId,
        can_view_registrations: permissions.can_view_registrations ?? true,
        can_export_data: permissions.can_export_data ?? true,
        can_manage_payments: permissions.can_manage_payments ?? true,
        can_manage_abstracts: permissions.can_manage_abstracts ?? true,
        can_check_in: permissions.can_check_in ?? true,
        can_generate_certificates: permissions.can_generate_certificates ?? true,
        can_edit_conference: permissions.can_edit_conference ?? false,
        can_delete_data: permissions.can_delete_data ?? false,
        granted_by: profile.id
      }))

      const { error: permError } = await supabase
        .from('conference_permissions')
        .insert(conferencePermissions)

      if (permError) {
        console.error('Permissions creation error:', permError)
        console.warn('⚠️ User created but permissions assignment failed')
      } else {
        console.log(`✅ Assigned ${conference_ids.length} conferences with permissions`)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: {
          id: authData.user.id,
          email,
          full_name,
          role
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the user' },
      { status: 500 }
    )
  }
}

