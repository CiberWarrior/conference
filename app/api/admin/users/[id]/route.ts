import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/auth-utils'

/**
 * GET /api/admin/users/[id]
 * Get single user details with permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id } = params
    
    // Verify user is Super Admin
    const profile = await getCurrentUserProfile()
    
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get user profile with permissions
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        conference_permissions (
          *,
          conferences (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Get user error:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user details and permissions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id } = params
    
    // Verify user is Super Admin
    const profile = await getCurrentUserProfile()
    
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      full_name, 
      phone, 
      organization,
      active,
      password,
      conference_ids,
      permissions
    } = body

    console.log('✏️ Updating user:', id)

    // Update user profile
    const profileUpdates: any = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined) profileUpdates.full_name = full_name
    if (phone !== undefined) profileUpdates.phone = phone
    if (organization !== undefined) profileUpdates.organization = organization
    if (active !== undefined) profileUpdates.active = active

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(profileUpdates)
      .eq('id', id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    console.log('✅ User profile updated')

    // Update password if provided
    if (password && password.length >= 8) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        id,
        { password }
      )

      if (passwordError) {
        console.error('Password update error:', passwordError)
        console.warn('⚠️ Profile updated but password update failed')
      } else {
        console.log('✅ Password updated')
      }
    }

    // Update conference permissions if provided
    if (conference_ids !== undefined && Array.isArray(conference_ids)) {
      // Delete existing permissions
      await supabase
        .from('conference_permissions')
        .delete()
        .eq('user_id', id)

      // Insert new permissions
      if (conference_ids.length > 0) {
        const conferencePermissions = conference_ids.map((conferenceId: string) => ({
          user_id: id,
          conference_id: conferenceId,
          can_view_registrations: permissions?.can_view_registrations ?? true,
          can_export_data: permissions?.can_export_data ?? true,
          can_manage_payments: permissions?.can_manage_payments ?? true,
          can_manage_abstracts: permissions?.can_manage_abstracts ?? true,
          can_check_in: permissions?.can_check_in ?? true,
          can_generate_certificates: permissions?.can_generate_certificates ?? true,
          can_edit_conference: permissions?.can_edit_conference ?? false,
          can_delete_data: permissions?.can_delete_data ?? false,
          granted_by: profile.id
        }))

        const { error: permError } = await supabase
          .from('conference_permissions')
          .insert(conferencePermissions)

        if (permError) {
          console.error('Permissions update error:', permError)
          console.warn('⚠️ Profile updated but permissions update failed')
        } else {
          console.log(`✅ Updated permissions for ${conference_ids.length} conferences`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating the user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user (deactivate instead of hard delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id } = params
    
    // Verify user is Super Admin
    const profile = await getCurrentUserProfile()
    
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Prevent deleting yourself
    if (id === profile.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deactivating user:', id)

    // Soft delete - deactivate instead of hard delete
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Deactivation error:', error)
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      )
    }

    console.log('✅ User deactivated')

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deactivating the user' },
      { status: 500 }
    )
  }
}

