import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError, ApiError } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/program — public program
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createAdminClient()

    const { data: conference, error: confError } = await supabase
      .from('conferences')
      .select('id, name, slug, start_date, end_date, location, published, primary_color')
      .eq('slug', slug)
      .single()

    if (confError || !conference) throw ApiError.notFound('Conference not found')
    if (!conference.published) throw ApiError.notFound('Conference not found')

    const { data: sessions, error } = await supabase
      .from('program_sessions')
      .select(
        'id, title, description, track, room, session_type, starts_at, ends_at, sort_order, items:program_items(id, title, speaker_name, starts_at, ends_at, sort_order, abstract:abstracts(id, title, file_name, status))'
      )
      .eq('conference_id', conference.id)
      .order('sort_order', { ascending: true })

    if (error) throw ApiError.internal('Failed to load program')

    // Only show accepted abstracts on public program when linked
    const sanitized = (sessions || []).map((s: any) => ({
      ...s,
      items: (s.items || [])
        .filter((item: any) => {
          if (!item.abstract) return true
          return item.abstract.status === 'accepted'
        })
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
    }))

    return NextResponse.json({ conference, sessions: sanitized })
  } catch (error) {
    return handleApiError(error)
  }
}
