import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/tickets/[id]
 * Get one support ticket.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin' && profile?.role !== 'conference_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        conferences(id, name)
      `)
      .eq('id', id)
      .single()

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (profile?.role === 'conference_admin' && ticket.conference_id) {
      const { data: perm } = await supabase
        .from('conference_permissions')
        .select('conference_id')
        .eq('user_id', user.id)
        .eq('conference_id', ticket.conference_id)
        .single()
      if (!perm) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ ticket })
  } catch (e) {
    log.error('Ticket GET error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/tickets/[id]
 * Update status, priority, assigned_to, etc.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin' && profile?.role !== 'conference_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const allowed = ['status', 'priority', 'category', 'assigned_to_user_id']
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key]
    }
    if (body.status === 'resolved' || body.status === 'closed') {
      update.resolved_at = new Date().toISOString()
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      log.error('Ticket PATCH error', error)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    return NextResponse.json({ ticket })
  } catch (e) {
    log.error('Ticket PATCH error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
