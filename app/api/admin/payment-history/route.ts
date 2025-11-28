import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/payment-history
 * Get payment history for a registration or all registrations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('registrationId')
    const conferenceId = searchParams.get('conference_id')

    const supabase = createServerClient()

    // If conference_id provided, filter through registrations
    if (conferenceId) {
      // First get all registration IDs for this conference
      const { data: registrations } = await supabase
        .from('registrations')
        .select('id')
        .eq('conference_id', conferenceId)

      const registrationIds = registrations?.map((r) => r.id) || []

      if (registrationIds.length === 0) {
        return NextResponse.json({
          history: [],
          total: 0,
        })
      }

      let query = supabase
        .from('payment_history')
        .select('*')
        .in('registration_id', registrationIds)

      if (registrationId) {
        query = query.eq('registration_id', registrationId)
      }

      const { data: history, error } = await query.order('created_at', {
        ascending: false,
      })

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch payment history' },
          { status: 500 }
        )
      }

      // If registrationId provided, also get registration details
      if (registrationId) {
        const { data: registration } = await supabase
          .from('registrations')
          .select('first_name, last_name, email')
          .eq('id', registrationId)
          .single()

        return NextResponse.json({
          history: history || [],
          registration,
          total: history?.length || 0,
        })
      }

      return NextResponse.json({
        history: history || [],
        total: history?.length || 0,
      })
    }

    // Fallback: if no conference_id, filter by registrationId only
    let query = supabase.from('payment_history').select('*')

    if (registrationId) {
      query = query.eq('registration_id', registrationId)
    }

    const { data: history, error } = await query.order('created_at', {
      ascending: false,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch payment history' },
        { status: 500 }
      )
    }

    // If registrationId provided, also get registration details
    if (registrationId) {
      const { data: registration } = await supabase
        .from('registrations')
        .select('first_name, last_name, email')
        .eq('id', registrationId)
        .single()

      return NextResponse.json({
        history: history || [],
        registration,
        total: history?.length || 0,
      })
    }

    return NextResponse.json({
      history: history || [],
      total: history?.length || 0,
    })
  } catch (error) {
    console.error('Get payment history error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment history' },
      { status: 500 }
    )
  }
}

