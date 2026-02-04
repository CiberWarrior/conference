import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/fee-type-usage
 * Public: returns count of registrations per registration_fee_type for this conference.
 * Used by registration form to show correct price when capacity is reached.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createServerClient()

    const { data: conf, error: confError } = await supabase
      .from('conferences')
      .select('id')
      .eq('slug', slug)
      .single()

    if (confError || !conf) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('registration_fee_type')
      .eq('conference_id', conf.id)
      .not('registration_fee_type', 'is', null)

    if (error) {
      log.error('Fee type usage fetch error', error)
      return NextResponse.json(
        { error: 'Failed to fetch usage' },
        { status: 500 }
      )
    }

    const usage: Record<string, number> = {}
    for (const row of registrations || []) {
      const ft = row.registration_fee_type as string
      if (ft) {
        usage[ft] = (usage[ft] || 0) + 1
      }
    }

    return NextResponse.json({ usage })
  } catch (e) {
    log.error('Fee type usage error', e)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
