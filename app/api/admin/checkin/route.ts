import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId } = body

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if registration exists
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('id, checked_in, checked_in_at, first_name, last_name, email')
      .eq('id', registrationId)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
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
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve check-in status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('registrationId')

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: registration, error } = await supabase
      .from('registrations')
      .select('id, checked_in, checked_in_at, first_name, last_name, email')
      .eq('id', registrationId)
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
    console.error('Get check-in status error:', error)
    return NextResponse.json(
      { error: 'Failed to get check-in status' },
      { status: 500 }
    )
  }
}

