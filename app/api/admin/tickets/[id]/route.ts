import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
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
  const { id } = await params
  
  try {
    // ✅ Use centralized auth helper
    const { user, profile, supabase } = await requireAuth()

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        conferences(id, name)
      `)
      .eq('id', id)
      .single()

    if (error || !ticket) {
      throw ApiError.notFound('Ticket')
    }

    if (profile.role === 'conference_admin' && ticket.conference_id) {
      const { data: perm } = await supabase
        .from('conference_permissions')
        .select('conference_id')
        .eq('user_id', user.id)
        .eq('conference_id', ticket.conference_id)
        .single()
      if (!perm) {
        throw ApiError.forbidden('You do not have access to this ticket')
      }
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    return handleApiError(error, { action: 'get_ticket', ticketId: id })
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
  const { id } = await params
  
  try {
    // ✅ Use centralized auth helper
    const { user, profile, supabase } = await requireAuth()

    // Check admin role
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
  } catch (error) {
    return handleApiError(error, { action: 'update_ticket', ticketId: id })
  }
}
