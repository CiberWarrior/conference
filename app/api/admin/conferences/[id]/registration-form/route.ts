import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { isAuthenticated, getCurrentUser } from '@/lib/auth'
import { log } from '@/lib/logger'
import { z } from 'zod'

// Validation schema for custom registration field
const CustomFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/i, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  type: z.enum(['text', 'textarea', 'email', 'tel', 'number', 'date', 'select', 'checkbox']),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
})

// Validation schema for participant settings
const ParticipantSettingsSchema = z.object({
  enabled: z.boolean(),
  minParticipants: z.number().min(1),
  maxParticipants: z.number().min(1).max(50),
  requireUniqueEmails: z.boolean(),
  participantFields: z.array(z.string()),
  customFieldsPerParticipant: z.boolean(),
  participantLabel: z.string().optional(),
})

const UpdateFormSchema = z.object({
  customFields: z.array(CustomFieldSchema),
  participantSettings: ParticipantSettingsSchema.optional(),
  registrationInfoText: z.string().optional(),
})

/**
 * GET /api/admin/conferences/[id]/registration-form
 * Get custom registration fields for a conference
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conferenceId = params.id

    log.info('Fetching registration form', {
      conferenceId,
      action: 'get_registration_form',
    })

    // Authentication check
    const authCheck = await isAuthenticated(request)
    if (!authCheck) {
      log.warn('Unauthorized access attempt', {
        conferenceId,
        action: 'get_registration_form',
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const supabase = createAdminClient()

    // Check if user has permission to view this conference
    const isSuperAdmin = user.role === 'super_admin'
    
    if (!isSuperAdmin) {
      // Check if user has permission for this conference
      const { data: permission } = await supabase
        .from('conference_permissions')
        .select('can_view_registrations, can_manage_registration_form')
        .eq('user_id', user.id)
        .eq('conference_id', conferenceId)
        .single()

      if (!permission || (!permission.can_view_registrations && !permission.can_manage_registration_form)) {
        log.warn('Insufficient permissions', {
          userId: user.id,
          conferenceId,
          action: 'get_registration_form',
        })
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Fetch conference settings
    const { data: conference, error } = await supabase
      .from('conferences')
      .select('id, name, settings')
      .eq('id', conferenceId)
      .single()

    if (error || !conference) {
      log.error('Conference not found', error, {
        conferenceId,
        action: 'get_registration_form',
      })
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    const customFields = conference.settings?.custom_registration_fields || []
    const participantSettings = conference.settings?.participant_settings || null
    const registrationInfoText = conference.settings?.registration_info_text || ''

    log.info('Registration form fetched successfully', {
      conferenceId,
      fieldCount: customFields.length,
      participantsEnabled: participantSettings?.enabled || false,
      hasInfoText: !!registrationInfoText,
      action: 'get_registration_form',
    })

    return NextResponse.json({
      customFields,
      participantSettings,
      registrationInfoText,
    })
  } catch (error) {
    log.error('Error fetching registration form', error, {
      conferenceId: params.id,
      action: 'get_registration_form',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/conferences/[id]/registration-form
 * Update custom registration fields for a conference
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conferenceId = params.id

    log.info('Updating registration form', {
      conferenceId,
      action: 'update_registration_form',
    })

    // Authentication check
    const authCheck = await isAuthenticated(request)
    if (!authCheck) {
      log.warn('Unauthorized access attempt', {
        conferenceId,
        action: 'update_registration_form',
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const supabase = createAdminClient()

    // Check if user has permission to edit registration form
    const isSuperAdmin = user.role === 'super_admin'
    
    // DEBUG: Log user info
    log.info('User attempting to update registration form', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      isSuperAdmin,
      conferenceId,
    })
    
    if (!isSuperAdmin) {
      // Check if user has permission for this conference
      const { data: permission } = await supabase
        .from('conference_permissions')
        .select('can_manage_registration_form, can_edit_conference')
        .eq('user_id', user.id)
        .eq('conference_id', conferenceId)
        .single()

      log.info('Permission check for non-super-admin', {
        userId: user.id,
        permission,
        conferenceId,
      })

      if (!permission || (!permission.can_manage_registration_form && !permission.can_edit_conference)) {
        log.warn('Insufficient permissions', {
          userId: user.id,
          userRole: user.role,
          conferenceId,
          permission,
          action: 'update_registration_form',
        })
        return NextResponse.json(
          { 
            error: 'Insufficient permissions to edit registration form',
            debug: {
              userRole: user.role,
              isSuperAdmin,
              hasPermission: !!permission,
              canManageForm: permission?.can_manage_registration_form,
              canEditConference: permission?.can_edit_conference,
            }
          },
          { status: 403 }
        )
      }
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = UpdateFormSchema.safeParse(body)

    if (!validationResult.success) {
      log.warn('Invalid registration form data', {
        conferenceId,
        errors: validationResult.error.errors,
        action: 'update_registration_form',
      })
      return NextResponse.json(
        { 
          error: 'Invalid form data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { customFields, participantSettings, registrationInfoText } = validationResult.data

    // Check for duplicate field names
    const fieldNames = customFields.map(f => f.name.toLowerCase())
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      return NextResponse.json(
        { 
          error: 'Duplicate field names found',
          details: duplicates,
        },
        { status: 400 }
      )
    }

    // Fetch current conference settings
    const { data: conference, error: fetchError } = await supabase
      .from('conferences')
      .select('settings')
      .eq('id', conferenceId)
      .single()

    if (fetchError || !conference) {
      log.error('Conference not found', fetchError, {
        conferenceId,
        action: 'update_registration_form',
      })
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Update settings with new custom fields, participant settings, and registration info text
    const updatedSettings = {
      ...conference.settings,
      custom_registration_fields: customFields,
      participant_settings: participantSettings,
      registration_info_text: registrationInfoText,
    }

    // Update conference
    const { error: updateError } = await supabase
      .from('conferences')
      .update({ 
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conferenceId)

    if (updateError) {
      log.error('Error updating registration form', updateError, {
        conferenceId,
        action: 'update_registration_form',
      })
      return NextResponse.json(
        { error: 'Failed to update registration form' },
        { status: 500 }
      )
    }

    log.info('Registration form updated successfully', {
      conferenceId,
      userId: user.id,
      fieldCount: customFields.length,
      participantsEnabled: participantSettings?.enabled || false,
      hasInfoText: !!registrationInfoText,
      action: 'update_registration_form',
    })

    return NextResponse.json({
      success: true,
      customFields,
      participantSettings,
      registrationInfoText,
    })
  } catch (error) {
    log.error('Error updating registration form', error, {
      conferenceId: params.id,
      action: 'update_registration_form',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
