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
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          details: clientError?.message || 'Supabase client initialization failed'
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    const { data: conference, error: confError } = await supabase
      .from('conferences')
      .select('id, name, slug, start_date, end_date, location, venue, logo_url')
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

    // Try to select all fields, but handle case where new columns don't exist yet
    const { data: page, error: pageError } = await supabase
      .from('conference_pages')
      .select('*')
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
        start_date: (conference as any).start_date ?? null,
        end_date: (conference as any).end_date ?? null,
        location: (conference as any).location ?? null,
        venue: (conference as any).venue ?? null,
        logo_url: (conference as any).logo_url ?? null,
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
    
    // Ensure we always return JSON, never HTML
    return NextResponse.json(
      { 
        error: 'Failed to fetch page',
        details: error?.message || 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

