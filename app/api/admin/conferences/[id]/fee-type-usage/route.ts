import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/conferences/[id]/fee-type-usage
 * Returns count of registrations per registration_fee_type for this conference.
 * Used for capacity display (Preostalo) and price-after-capacity logic.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conferenceId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isSuperAdmin = profile?.role === 'super_admin'
    const isConferenceAdmin = profile?.role === 'conference_admin'
    if (!isSuperAdmin && !isConferenceAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (isConferenceAdmin) {
      const { data: perm } = await supabase
        .from('conference_permissions')
        .select('conference_id')
        .eq('user_id', user.id)
        .eq('conference_id', conferenceId)
        .single()
      if (!perm) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('registration_fee_type')
      .eq('conference_id', conferenceId)
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
