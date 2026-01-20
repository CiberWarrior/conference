import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import type { CreateConferencePageInput } from '@/types/conference-page'

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

  return { ok: true as const, userId: user.id, role: profile.role }
}

/**
 * GET /api/admin/conferences/[id]/pages
 * List pages for a conference (admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await assertCanEditConference(params.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const adminSupabase = createAdminClient()
    const { data: pages, error } = await adminSupabase
      .from('conference_pages')
      .select('*')
      .eq('conference_id', params.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      log.error('Failed to list conference pages', error, {
        conferenceId: params.id,
        userId: auth.userId,
        action: 'list_conference_pages',
        errorMessage: error.message,
        errorCode: error.code,
        errorHint: error.hint,
      })
      return NextResponse.json({ 
        error: 'Failed to fetch pages', 
        details: error.message || error.hint || 'Unknown database error'
      }, { status: 500 })
    }

    return NextResponse.json({ pages: pages || [] })
  } catch (error) {
    log.error('List conference pages error', error, {
      conferenceId: params.id,
      action: 'list_conference_pages',
    })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to fetch pages',
      details: errorMessage
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/conferences/[id]/pages
 * Create a page for a conference (admin)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await assertCanEditConference(params.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = (await request.json()) as CreateConferencePageInput

    if (!body?.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body?.slug?.trim()) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const slug = body.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const insertData: any = {
      conference_id: params.id,
      title: body.title.trim(),
      slug,
      content: body.content || '',
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
      published: !!body.published,
    }

    // Add hero fields if provided
    if (typeof body.hero_subtitle === 'string') insertData.hero_subtitle = body.hero_subtitle.trim() || null
    if (typeof body.hero_image_url === 'string') insertData.hero_image_url = body.hero_image_url.trim() || null
    if (typeof body.hero_background_color === 'string') insertData.hero_background_color = body.hero_background_color.trim() || null
    if (typeof body.hero_layout_type === 'string') insertData.hero_layout_type = body.hero_layout_type.trim() || null
    if (typeof body.hero_logo_url === 'string') insertData.hero_logo_url = body.hero_logo_url.trim() || null

    // hero_info_cards can be array/object or JSON string from UI
    const heroInfoCardsRaw: any = (body as any).hero_info_cards
    if (heroInfoCardsRaw !== undefined) {
      if (heroInfoCardsRaw === null || heroInfoCardsRaw === '') {
        insertData.hero_info_cards = null
      } else if (typeof heroInfoCardsRaw === 'string') {
        try {
          insertData.hero_info_cards = JSON.parse(heroInfoCardsRaw)
        } catch {
          insertData.hero_info_cards = null
        }
      } else if (Array.isArray(heroInfoCardsRaw) || typeof heroInfoCardsRaw === 'object') {
        insertData.hero_info_cards = heroInfoCardsRaw
      }
    }

    // SEO / CSS fields
    if (typeof (body as any).meta_title === 'string') insertData.meta_title = (body as any).meta_title.trim() || null
    if (typeof (body as any).meta_description === 'string')
      insertData.meta_description = (body as any).meta_description.trim() || null
    if (typeof (body as any).og_image_url === 'string') insertData.og_image_url = (body as any).og_image_url.trim() || null
    if (typeof (body as any).custom_css === 'string') insertData.custom_css = (body as any).custom_css || null

    const { data: page, error } = await adminSupabase
      .from('conference_pages')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      log.error('Failed to create conference page', error, {
        conferenceId: params.id,
        userId: auth.userId,
        action: 'create_conference_page',
      })
      return NextResponse.json({ error: 'Failed to create page', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    log.error('Create conference page error', error, {
      conferenceId: params.id,
      action: 'create_conference_page',
    })
    return NextResponse.json(
      {
        error: 'Failed to create page',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

