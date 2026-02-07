import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/pages
 * Public list of published custom pages for a conference.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    let supabase
    try {
      supabase = createAdminClient()
    } catch (clientError: any) {
      log.error('Failed to create admin client', clientError, {
        slug: params.slug,
        action: 'list_public_conference_pages',
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
      .select('id, slug')
      .eq('slug', params.slug)
      .eq('published', true)
      .eq('active', true)
      .single()

    if (confError || !conference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    const { data: pages, error } = await supabase
      .from('conference_pages')
      .select('id, slug, title, sort_order')
      .eq('conference_id', conference.id)
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      log.error('Failed to list public conference pages', error, {
        slug: params.slug,
        action: 'list_public_conference_pages',
      })
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    return NextResponse.json({ pages: pages || [] })
  } catch (error: any) {
    log.error('Public conference pages list error', error, {
      slug: params.slug,
      action: 'list_public_conference_pages',
      errorMessage: error?.message,
    })
    
    // Ensure we always return JSON, never HTML
    return NextResponse.json(
      { 
        error: 'Failed to fetch pages',
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

