import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/participants
 * Get all participants with stats (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ Use centralized auth helper (Super Admin only)
    const { supabase } = await requireSuperAdmin()

    // Get search params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const hasAccount = searchParams.get('has_account')
    const loyaltyTier = searchParams.get('loyalty_tier')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('participant_profiles')
      .select('*', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      )
    }

    if (hasAccount === 'true') {
      query = query.eq('has_account', true)
    } else if (hasAccount === 'false') {
      query = query.eq('has_account', false)
    }

    if (loyaltyTier) {
      query = query.eq('loyalty_tier', loyaltyTier)
    }

    // Execute query with pagination
    const { data: participants, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      log.error('Failed to fetch participants', error)
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      )
    }

    // Get registration counts for each participant
    const participantIds = participants.map((p) => p.id)
    const { data: registrationCounts } = await supabase
      .from('participant_registrations')
      .select('participant_id, status')
      .in('participant_id', participantIds)

    // Build stats for each participant
    const participantsWithStats = participants.map((participant) => {
      const regs = registrationCounts?.filter(
        (r) => r.participant_id === participant.id
      )
      return {
        ...participant,
        stats: {
          total_registrations: regs?.length || 0,
          active_registrations:
            regs?.filter((r) => r.status === 'confirmed').length || 0,
          attended_events:
            regs?.filter((r) => r.status === 'attended').length || 0,
        },
      }
    })

    return NextResponse.json({
      success: true,
      participants: participantsWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, { action: 'get_participants' })
  }
}
