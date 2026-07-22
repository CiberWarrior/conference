import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  emailLookupRateLimit,
  checkRateLimit,
  createRateLimitHeaders,
  getClientIP,
} from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/check-registration?email=user@example.com
 * Check if user has an existing registration for this conference.
 *
 * Used by the abstract submission form to link an abstract to a registration.
 * Returns only an opaque registration ID — no personal data — and is
 * rate-limited to prevent email enumeration.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Rate limit by IP to prevent email enumeration
    const rateLimitResult = await checkRateLimit(
      emailLookupRateLimit,
      `check-registration:${getClientIP(request)}`
    )
    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // First, get conference by slug to get its ID
    const { data: conference, error: confError } = await supabase
      .from('conferences')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (confError || !conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Check if registration exists for this conference and email
    // Use maybeSingle() to avoid error logs when no registration found
    const { data: registration, error } = await supabase
      .from('registrations')
      .select('id')
      .eq('conference_id', conference.id)
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      // Actual error (not just "no rows")
      console.error('Error checking registration:', error)
      return NextResponse.json(
        { error: 'Failed to check registration' },
        { status: 500 }
      )
    }

    // Only expose an opaque ID — never names or other personal data
    return NextResponse.json({
      found: !!registration,
      registrationId: registration?.id ?? null,
    })
  } catch (error) {
    console.error('Error checking registration:', error)
    return NextResponse.json(
      { error: 'Failed to check registration' },
      { status: 500 }
    )
  }
}
