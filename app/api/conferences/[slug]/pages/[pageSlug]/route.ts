import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/pages/[pageSlug]
 * Public endpoint for published custom pages.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; pageSlug: string } }
) {
  try {
    let supabase
    try {
      supabase = createAdminClient()
    } catch (clientError: any) {
      log.error('Failed to create admin client', clientError, {
        slug: params.slug,
        pageSlug: params.pageSlug,
        action: 'get_public_conference_page',
      })
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: clientError.message 
      }, { status: 500 })
    }

    const { data: conference, error: confError } = await supabase
      .from('conferences')
      .select('id, name, slug')
      .eq('slug', params.slug)
      .eq('published', true)
      .eq('active', true)
      .single()

    if (confError) {
      log.error('Conference query error', confError, {
        slug: params.slug,
        action: 'get_public_conference_page',
      })
      return NextResponse.json({ 
        error: 'Conference not found',
        details: confError.message 
      }, { status: 404 })
    }

    if (!conference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    const { data: page, error: pageError } = await supabase
      .from('conference_pages')
      .select('id, slug, title, content, sort_order, published, hero_title, hero_subtitle, hero_image_url, hero_background_color, created_at, updated_at')
      .eq('conference_id', conference.id)
      .eq('slug', params.pageSlug)
      .eq('published', true)
      .single()

    if (pageError) {
      log.error('Page query error', pageError, {
        conferenceId: conference.id,
        pageSlug: params.pageSlug,
        action: 'get_public_conference_page',
      })
      return NextResponse.json({ 
        error: 'Page not found',
        details: pageError.message 
      }, { status: 404 })
    }

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({
      conference: {
        id: conference.id,
        name: conference.name,
        slug: conference.slug,
      },
      page,
    })
  } catch (error: any) {
    log.error('Public conference page fetch error', error, {
      slug: params.slug,
      pageSlug: params.pageSlug,
      action: 'get_public_conference_page',
      errorMessage: error?.message,
      errorStack: error?.stack,
    })
    return NextResponse.json({ 
      error: 'Failed to fetch page',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

