import { NextRequest, NextResponse } from 'next/server'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

interface CheckinRequestBody {
  registrationId: string
  conferenceId: string
}

export async function POST(request: NextRequest) {
  let body: CheckinRequestBody | null = null

  try {
    body = await request.json()
    
    if (!body) {
      throw ApiError.validationError('Request body is required')
    }
    
    const { registrationId, conferenceId } = body

    if (!registrationId) {
      throw ApiError.validationError('Registration ID is required')
    }

    if (!conferenceId) {
      throw ApiError.validationError('Conference ID is required')
    }

    // ✅ Use centralized auth helper (checks can_check_in permission)
    const { supabase } = await requireConferencePermission(conferenceId, 'can_check_in')

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
    return handleApiError(error, { 
      action: 'checkin', 
      registrationId: body?.registrationId,
      conferenceId: body?.conferenceId 
    })
  }
}

// GET endpoint to retrieve check-in status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('registrationId')
    const conferenceId = searchParams.get('conferenceId')

    if (!registrationId) {
      throw ApiError.validationError('Registration ID is required')
    }

    if (!conferenceId) {
      throw ApiError.validationError('Conference ID is required')
    }

    // ✅ Use centralized auth helper (checks can_check_in permission)
    const { supabase } = await requireConferencePermission(conferenceId, 'can_check_in')

    const { data: registration, error } = await supabase
      .from('registrations')
      .select('id, checked_in, checked_in_at, first_name, last_name, email, conference_id')
      .eq('id', registrationId)
      .eq('conference_id', conferenceId)
      .single()

    if (error || !registration) {
      throw ApiError.notFound('Registration')
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
    return handleApiError(error, { action: 'get_checkin_status' })
  }
}

