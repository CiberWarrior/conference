import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/check-registration?email=user@example.com
 * Check if user has an existing registration for this conference
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
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
    const { data: registration, error } = await supabase
      .from('registrations')
      .select('id, first_name, last_name, status')
      .eq('conference_id', conference.id)
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !registration) {
      // No registration found - this is not an error, just return empty
      return NextResponse.json({
        found: false,
        registrationId: null,
      })
    }

    return NextResponse.json({
      found: true,
      registrationId: registration.id,
      firstName: registration.first_name,
      lastName: registration.last_name,
      status: registration.status,
    })
  } catch (error) {
    console.error('Error checking registration:', error)
    return NextResponse.json(
      { error: 'Failed to check registration' },
      { status: 500 }
    )
  }
}
