import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import type { UpdateConferencePageInput } from '@/types/conference-page'

export const dynamic = 'force-dynamic'

async function assertCanEditConference(conferenceId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false as const, status: 401 as const, error: 'Unauthorized' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { ok: false as const, status: 403 as const, error: 'User profile not found' }
  }

  if (!profile.active) {
    return { ok: false as const, status: 403 as const, error: 'Your account is deactivated' }
  }

  if (profile.role !== 'super_admin') {
    const { data: permission } = await supabase
      .from('conference_permissions')
      .select('can_edit_conference')
      .eq('user_id', user.id)
      .eq('conference_id', conferenceId)
      .single()

    if (!permission?.can_edit_conference) {
      return {
        ok: false as const,
        status: 403 as const,
        error: 'Forbidden. You do not have permission to edit this conference.',
      }
    }
  }

  return { ok: true as const, userId: user.id }
}

/**
 * GET /api/admin/conferences/[id]/pages/[pageId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const auth = await assertCanEditConference(params.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const adminSupabase = createAdminClient()
    const { data: page, error } = await adminSupabase
      .from('conference_pages')
      .select('*')
      .eq('id', params.pageId)
      .eq('conference_id', params.id)
      .single()

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Get conference slug for preview link
    const { data: conference } = await adminSupabase
      .from('conferences')
      .select('slug')
      .eq('id', params.id)
      .single()

    return NextResponse.json({ 
      page,
      conference_slug: conference?.slug || null 
    })
  } catch (error) {
    log.error('Get conference page error', error, {
      conferenceId: params.id,
      pageId: params.pageId,
      action: 'get_conference_page',
    })
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/conferences/[id]/pages/[pageId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const auth = await assertCanEditConference(params.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = (await request.json()) as UpdateConferencePageInput

    const update: any = {}
    if (typeof body.title === 'string') update.title = body.title.trim()
    if (typeof body.content === 'string') update.content = body.content
    if (typeof body.sort_order === 'number') update.sort_order = body.sort_order
    if (typeof body.published === 'boolean') update.published = body.published
    
    // Hero fields
    if ('hero_subtitle' in body) update.hero_subtitle = typeof body.hero_subtitle === 'string' ? body.hero_subtitle.trim() || null : null
    if ('hero_image_url' in body) update.hero_image_url = typeof body.hero_image_url === 'string' ? body.hero_image_url.trim() || null : null
    if ('hero_background_color' in body) update.hero_background_color = typeof body.hero_background_color === 'string' ? body.hero_background_color.trim() || null : null

    if (typeof body.slug === 'string') {
      const slug = body.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!slug) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
      update.slug = slug
    }

    update.updated_at = new Date().toISOString()

    const adminSupabase = createAdminClient()
    const { data: page, error } = await adminSupabase
      .from('conference_pages')
      .update(update)
      .eq('id', params.pageId)
      .eq('conference_id', params.id)
      .select('*')
      .single()

    if (error) {
      log.error('Failed to update conference page', error, {
        conferenceId: params.id,
        pageId: params.pageId,
        userId: auth.userId,
        action: 'update_conference_page',
      })
      return NextResponse.json({ error: 'Failed to update page', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    log.error('Update conference page error', error, {
      conferenceId: params.id,
      pageId: params.pageId,
      action: 'update_conference_page',
    })
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/conferences/[id]/pages/[pageId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const auth = await assertCanEditConference(params.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('conference_pages')
      .delete()
      .eq('id', params.pageId)
      .eq('conference_id', params.id)

    if (error) {
      log.error('Failed to delete conference page', error, {
        conferenceId: params.id,
        pageId: params.pageId,
        userId: auth.userId,
        action: 'delete_conference_page',
      })
      return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Delete conference page error', error, {
      conferenceId: params.id,
      pageId: params.pageId,
      action: 'delete_conference_page',
    })
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}

