import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/tickets
 * List support tickets. Query: stats_only=1 returns open count for dashboard.
 * Super admin sees all; conference_admin sees only tickets for their conferences.
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ Use centralized auth helper
    const { user, profile, supabase } = await requireAuth()

    const isSuperAdmin = profile.role === 'super_admin'
    const isConferenceAdmin = profile.role === 'conference_admin'

    const { searchParams } = new URL(request.url)
    const statsOnly = searchParams.get('stats_only') === '1'

    if (statsOnly) {
      let query = supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress'])

      if (isConferenceAdmin) {
        const { data: perms } = await supabase
          .from('conference_permissions')
          .select('conference_id')
          .eq('user_id', user.id)
        const confIds = (perms || []).map((p: { conference_id: string }) => p.conference_id)
        if (confIds.length === 0) {
          return NextResponse.json({ open: 0 } as { open: number })
        }
        const orParts = confIds.map((id) => `conference_id.eq.${id}`).join(',') + ',conference_id.is.null'
        query = query.or(orParts)
      }

      const { count, error: countError } = await query
      if (countError) {
        log.error('Tickets stats error', countError)
        return NextResponse.json({ open: 0 } as { open: number })
      }
      return NextResponse.json({ open: count ?? 0 } as { open: number })
    }

    let query = supabase
      .from('support_tickets')
      .select(`
        id,
        subject,
        description,
        status,
        priority,
        category,
        conference_id,
        created_by_email,
        assigned_to_user_id,
        resolved_at,
        created_at,
        updated_at,
        conferences(id, name)
      `)
      .order('created_at', { ascending: false })

    if (isConferenceAdmin) {
      const { data: perms } = await supabase
        .from('conference_permissions')
        .select('conference_id')
        .eq('user_id', user.id)
      const confIds = (perms || []).map((p: { conference_id: string }) => p.conference_id)
      if (confIds.length === 0) {
        return NextResponse.json({ tickets: [] })
      }
      const orParts = confIds.map((id) => `conference_id.eq.${id}`).join(',') + ',conference_id.is.null'
      query = query.or(orParts)
    }

    const statusFilter = searchParams.get('status')
    if (statusFilter) query = query.eq('status', statusFilter)

    const conferenceIdParam = searchParams.get('conference_id')
    if (conferenceIdParam) {
      if (isConferenceAdmin) {
        const { data: perm } = await supabase
          .from('conference_permissions')
          .select('conference_id')
          .eq('user_id', user.id)
          .eq('conference_id', conferenceIdParam)
          .single()
        if (!perm) {
          return NextResponse.json({ tickets: [] })
        }
      }
      query = query.eq('conference_id', conferenceIdParam)
    }

    const { data: tickets, error } = await query

    if (error) {
      log.error('Tickets list error', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    return NextResponse.json({ tickets: tickets ?? [] })
  } catch (error) {
    return handleApiError(error, { action: 'get_tickets' })
  }
}

/**
 * POST /api/admin/tickets
 * Create a support ticket (admin only).
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Use centralized auth helper
    const { user, profile, supabase } = await requireAuth()

    const body = await request.json()
    const {
      subject,
      description,
      priority = 'medium',
      category,
      conference_id,
      create_for_hotel_full,
      hotel_id,
      hotel_name,
    } = body

    if (create_for_hotel_full && conference_id && hotel_id && hotel_name) {
      const marker = `Hotel ID: ${hotel_id}`
      const { data: existing } = await supabase
        .from('support_tickets')
        .select('id, subject, description, status, priority, category, conference_id, created_at, updated_at')
        .eq('conference_id', conference_id)
        .eq('category', 'accommodation_full')
        .like('description', `%${marker}%`)
        .limit(1)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ ticket: existing, created: false })
      }

      const insertHotelFull = {
        subject: `Smještaj popunjen: ${String(hotel_name).slice(0, 200)}`,
        description: `${marker}. Sve rezervirane sobe su popunjene.`,
        status: 'open',
        priority: 'high',
        category: 'accommodation_full',
        conference_id,
        created_by_user_id: user.id,
        created_by_email: profile?.email ?? user.email ?? null,
      }
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert(insertHotelFull)
        .select()
        .single()

      if (error) {
        log.error('Tickets create hotel-full error', error)
        return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
      }
      return NextResponse.json({ ticket, created: true })
    }

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    const insert: Record<string, unknown> = {
      subject: String(subject).slice(0, 500),
      description: String(description),
      status: 'open',
      priority: ['low', 'medium', 'high', 'urgent'].includes(body.priority) ? body.priority : 'medium',
      created_by_user_id: user.id,
      created_by_email: profile?.email ?? user.email ?? null,
    }
    if (category != null) insert.category = String(category)
    if (conference_id != null) insert.conference_id = conference_id

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert(insert)
      .select()
      .single()

    if (error) {
      log.error('Tickets create error', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    return handleApiError(error, { action: 'create_ticket' })
  }
}
