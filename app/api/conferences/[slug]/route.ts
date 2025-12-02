import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import {
  getCachedConference,
  setCachedConference,
  getOrSetCache,
} from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/conferences/[slug]
 * Get a published conference by slug (public endpoint)
 * Cached for 1 hour
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Try to get from cache first
    const cached = await getCachedConference(params.slug)
    if (cached) {
      log.debug('Conference cache hit', { slug: params.slug })
      return NextResponse.json(
        { conference: cached },
        {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, max-age=3600', // 1 hour
          },
        }
      )
    }

    log.debug('Conference cache miss', { slug: params.slug })

    const supabase = await createServerClient()

    const { data: conference, error } = await supabase
      .from('conferences')
      .select('*')
      .eq('slug', params.slug)
      .eq('published', true)
      .eq('active', true)
      .single()

    if (error || !conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Cache the conference data (async, don't wait)
    setCachedConference(params.slug, conference).catch((err) => {
      log.error('Failed to cache conference', err, {
        slug: params.slug,
        action: 'cache_conference',
      })
    })

    return NextResponse.json(
      { conference },
      {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=3600', // 1 hour
        },
      }
    )
  } catch (error) {
    log.error('Get conference by slug error', error, {
      slug: params.slug,
      action: 'get_conference',
    })
    return NextResponse.json(
      { error: 'Failed to fetch conference' },
      { status: 500 }
    )
  }
}

