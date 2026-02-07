import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'
import { log } from '@/lib/logger'
import { getAvailableFeesForForm } from '@/lib/custom-registration-fees'
import type { RegistrationFeeOption } from '@/types/custom-registration-fee'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/registration-fees
 *
 * Public: returns custom registration fees for the registration form.
 * Conference is resolved by slug (server client, RLS); fees are read with admin client
 * so the list always returns regardless of RLS on custom_registration_fees.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const serverClient = await createServerClient()

    const { data: conf, error: confError } = await serverClient
      .from('conferences')
      .select('id')
      .eq('slug', slug)
      .single()

    if (confError || !conf) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    let adminClient
    try {
      adminClient = createAdminClient()
    } catch {
      log.error('Registration fees: admin client not available')
      return NextResponse.json(
        { error: 'Failed to load registration fees' },
        { status: 503 }
      )
    }
    const fees: RegistrationFeeOption[] = await getAvailableFeesForForm(
      adminClient,
      conf.id
    )

    return NextResponse.json({
      fees,
      // Default currency when conference has no fees (optional for form)
      currency: fees[0]?.currency ?? 'EUR',
    })
  } catch (e) {
    log.error('Registration fees fetch error', e)
    return NextResponse.json(
      { error: 'Failed to load registration fees' },
      { status: 500 }
    )
  }
}
