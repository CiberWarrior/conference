import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // NOTE: Defined outside try so we can safely reference it in catch logs
  let body: any = null
  try {
    body = await request.json()
    const { registrationId, conferenceId } = body

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    if (!conferenceId) {
      return NextResponse.json(
        { error: 'Conference ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Check if registration exists and belongs to the conference
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('id, checked_in, checked_in_at, first_name, last_name, email, conference_id')
      .eq('id', registrationId)
      .eq('conference_id', conferenceId)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found or does not belong to this conference' },
        { status: 404 }
      )
    }

    // If already checked in, return success
    if (registration.checked_in) {
      return NextResponse.json({
        success: true,
        message: 'Already checked in',
        registration: {
          id: registration.id,
          name: `${registration.first_name} ${registration.last_name}`,
          email: registration.email,
          checkedIn: true,
          checkedInAt: registration.checked_in_at,
        },
      })
    }

    // Update check-in status
    const { data: updatedRegistration, error: updateError } = await supabase
      .from('registrations')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', registrationId)
      .select('id, first_name, last_name, email, checked_in, checked_in_at')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update check-in status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully checked in',
      registration: {
        id: updatedRegistration.id,
        name: `${updatedRegistration.first_name} ${updatedRegistration.last_name}`,
        email: updatedRegistration.email,
        checkedIn: true,
        checkedInAt: updatedRegistration.checked_in_at,
      },
    })
  } catch (error) {
    log.error('Check-in error', error instanceof Error ? error : undefined, {
      registrationId: body?.registrationId || 'unknown',
      conferenceId: body?.conferenceId || 'unknown',
      action: 'checkin',
    })
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve check-in status
export async function GET(request: NextRequest) {
  // NOTE: Defined outside try so we can safely reference it in catch logs
  const searchParams = request.nextUrl.searchParams
  const registrationId = searchParams.get('registrationId')
  const conferenceId = searchParams.get('conferenceId')

  try {
    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    if (!conferenceId) {
      return NextResponse.json(
        { error: 'Conference ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    const { data: registration, error } = await supabase
      .from('registrations')
      .select('id, checked_in, checked_in_at, first_name, last_name, email, conference_id')
      .eq('id', registrationId)
      .eq('conference_id', conferenceId)
      .single()

    if (error || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      checkedIn: registration.checked_in || false,
      checkedInAt: registration.checked_in_at,
      registration: {
        id: registration.id,
        name: `${registration.first_name} ${registration.last_name}`,
        email: registration.email,
      },
    })
  } catch (error) {
    log.error('Get check-in status error', error instanceof Error ? error : undefined, {
      registrationId: registrationId || 'unknown',
      conferenceId: conferenceId || 'unknown',
      action: 'checkin_status',
    })
    return NextResponse.json(
      { error: 'Failed to get check-in status' },
      { status: 500 }
    )
  }
}

