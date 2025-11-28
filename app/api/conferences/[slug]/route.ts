import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/conferences/[slug]
 * Get a published conference by slug (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerClient()

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

    // Add cache control headers to prevent caching
    return NextResponse.json(
      { conference },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Get conference by slug error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conference' },
      { status: 500 }
    )
  }
}

