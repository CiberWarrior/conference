/**
 * Admin: reorder custom registration fees by display_order.
 * POST body: { feeIds: string[] } — order in array = display_order 0, 1, 2, ...
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireCanEditConference } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: conferenceId } = await Promise.resolve(params)
    if (!conferenceId) {
      return NextResponse.json(
        { error: 'Conference ID is required' },
        { status: 400 }
      )
    }
    await requireCanEditConference(conferenceId)
    const supabase = createAdminClient()

    const body = (await request.json()) as { feeIds?: string[] }
    const feeIds = body.feeIds
    if (!Array.isArray(feeIds) || feeIds.length === 0) {
      return NextResponse.json(
        { error: 'feeIds array is required' },
        { status: 400 }
      )
    }

    for (let i = 0; i < feeIds.length; i++) {
      const { error } = await supabase
        .from('custom_registration_fees')
        .update({ display_order: i })
        .eq('id', feeIds[i])
        .eq('conference_id', conferenceId)
      if (error) {
        log.error('Reorder registration fee error', { error, feeId: feeIds[i] })
        return NextResponse.json(
          { error: error.message || 'Failed to reorder' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, { action: 'reorder_registration_fees' })
  }
}
