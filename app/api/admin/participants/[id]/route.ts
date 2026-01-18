import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import { isSuperAdmin } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/participants/[id]
 * Get participant details with full registration history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only Super Admin can view participant details
    const hasPermission = await isSuperAdmin()

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get participant profile
    const { data: participant, error: profileError } = await supabase
      .from('participant_profiles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (profileError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // Get all registrations
    const { data: registrations, error: regsError } = await supabase
      .from('participant_registrations')
      .select(
        `
        *,
        conference:conferences (
          id,
          name,
          slug,
          event_type,
          start_date,
          end_date,
          location
        )
      `
      )
      .eq('participant_id', params.id)
      .order('registered_at', { ascending: false })

    if (regsError) {
      log.error('Failed to fetch participant registrations', regsError)
    }

    // Get loyalty discounts
    const { data: discounts } = await supabase
      .from('participant_loyalty_discounts')
      .select('*')
      .eq('participant_id', params.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      participant,
      registrations: registrations || [],
      discounts: discounts || [],
    })
  } catch (error) {
    log.error('Get participant details error', error as Error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/participants/[id]
 * Update participant basic information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only Super Admin can edit
    const hasPermission = await isSuperAdmin()

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { first_name, last_name, phone, country, institution } = body

    // Update participant profile
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('participant_profiles')
      .update({
        first_name,
        last_name,
        phone: phone || null,
        country: country || null,
        institution: institution || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError || !updatedParticipant) {
      log.error('Failed to update participant', updateError)
      return NextResponse.json(
        { error: 'Failed to update participant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      participant: updatedParticipant,
    })
  } catch (error) {
    log.error('Update participant error', error as Error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
