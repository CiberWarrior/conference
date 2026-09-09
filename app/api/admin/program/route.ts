import { NextRequest, NextResponse } from 'next/server'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/program?conferenceId=
 */
export async function GET(request: NextRequest) {
  try {
    const conferenceId = request.nextUrl.searchParams.get('conferenceId')
    if (!conferenceId) throw ApiError.validationError('conferenceId is required')

    const { supabase } = await requireConferencePermission(
      conferenceId,
      'can_edit_conference'
    )

    const { data: sessions, error } = await supabase
      .from('program_sessions')
      .select('*, items:program_items(*, abstract:abstracts(id, file_name, title, email, status))')
      .eq('conference_id', conferenceId)
      .order('sort_order', { ascending: true })

    if (error) throw ApiError.internal('Failed to load program')

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/program
 * action: create_session | update_session | delete_session | add_item | update_item | delete_item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conferenceId, action } = body || {}
    if (!conferenceId || !action) {
      throw ApiError.validationError('conferenceId and action are required')
    }

    const { supabase } = await requireConferencePermission(
      conferenceId,
      'can_edit_conference'
    )

    if (action === 'create_session') {
      const { title, description, track, room, session_type, starts_at, ends_at, sort_order } =
        body
      if (!title) throw ApiError.validationError('title is required')

      const { data, error } = await supabase
        .from('program_sessions')
        .insert({
          conference_id: conferenceId,
          title,
          description: description || null,
          track: track || null,
          room: room || null,
          session_type: session_type || 'oral',
          starts_at: starts_at || null,
          ends_at: ends_at || null,
          sort_order: sort_order ?? 0,
        })
        .select()
        .single()

      if (error) throw ApiError.internal('Failed to create session')
      return NextResponse.json({ success: true, session: data })
    }

    if (action === 'update_session') {
      const { sessionId, ...fields } = body
      if (!sessionId) throw ApiError.validationError('sessionId is required')
      const allowed = [
        'title',
        'description',
        'track',
        'room',
        'session_type',
        'starts_at',
        'ends_at',
        'sort_order',
      ]
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      for (const key of allowed) {
        if (fields[key] !== undefined) updates[key] = fields[key]
      }

      const { data, error } = await supabase
        .from('program_sessions')
        .update(updates)
        .eq('id', sessionId)
        .eq('conference_id', conferenceId)
        .select()
        .single()

      if (error) throw ApiError.internal('Failed to update session')
      return NextResponse.json({ success: true, session: data })
    }

    if (action === 'delete_session') {
      const { sessionId } = body
      if (!sessionId) throw ApiError.validationError('sessionId is required')
      const { error } = await supabase
        .from('program_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('conference_id', conferenceId)
      if (error) throw ApiError.internal('Failed to delete session')
      return NextResponse.json({ success: true })
    }

    if (action === 'add_item') {
      const { sessionId, abstractId, title, speaker_name, starts_at, ends_at, sort_order } =
        body
      if (!sessionId) throw ApiError.validationError('sessionId is required')

      const { data: session } = await supabase
        .from('program_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('conference_id', conferenceId)
        .single()
      if (!session) throw ApiError.notFound('Session not found')

      const { data, error } = await supabase
        .from('program_items')
        .insert({
          session_id: sessionId,
          abstract_id: abstractId || null,
          title: title || null,
          speaker_name: speaker_name || null,
          starts_at: starts_at || null,
          ends_at: ends_at || null,
          sort_order: sort_order ?? 0,
        })
        .select()
        .single()

      if (error) throw ApiError.internal('Failed to add item')
      return NextResponse.json({ success: true, item: data })
    }

    if (action === 'delete_item') {
      const { itemId, sessionId } = body
      if (!itemId || !sessionId) {
        throw ApiError.validationError('itemId and sessionId are required')
      }
      const { data: session } = await supabase
        .from('program_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('conference_id', conferenceId)
        .single()
      if (!session) throw ApiError.notFound('Session not found')

      const { error } = await supabase
        .from('program_items')
        .delete()
        .eq('id', itemId)
        .eq('session_id', sessionId)
      if (error) throw ApiError.internal('Failed to delete item')
      return NextResponse.json({ success: true })
    }

    throw ApiError.validationError('Unknown action')
  } catch (error) {
    return handleApiError(error)
  }
}
