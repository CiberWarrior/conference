/**
 * Admin: update and delete a single custom registration fee.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireCanEditConference } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'
import { calculatePriceWithVAT, calculatePriceWithoutVAT } from '@/utils/pricing'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string; feeId: string }> | { id: string; feeId: string }

function resolveParams(params: Params): Promise<{ id: string; feeId: string }> {
  return Promise.resolve(params as { id: string; feeId: string })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: conferenceId, feeId } = await resolveParams(params)
    if (!conferenceId || !feeId) {
      return NextResponse.json(
        { error: 'Conference ID and Fee ID are required' },
        { status: 400 }
      )
    }
    await requireCanEditConference(conferenceId)
    const supabase = createAdminClient()

    const body = await request.json() as {
      name?: string
      valid_from?: string
      valid_to?: string
      is_active?: boolean
      price_net?: number
      price_gross?: number
      prices_include_vat?: boolean
      vat_percentage?: number | null
      capacity?: number | null
      display_order?: number
    }

    // Ensure fee belongs to this conference
    const { data: existing, error: fetchErr } = await supabase
      .from('custom_registration_fees')
      .select('id, conference_id')
      .eq('id', feeId)
      .eq('conference_id', conferenceId)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: 'Fee not found' },
        { status: 404 }
      )
    }

    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.valid_from !== undefined) updates.valid_from = body.valid_from
    if (body.valid_to !== undefined) updates.valid_to = body.valid_to
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.capacity !== undefined)
      updates.capacity =
        body.capacity == null || (typeof body.capacity === 'string' && body.capacity === '')
          ? null
          : Number(body.capacity)
    if (body.display_order !== undefined)
      updates.display_order = Number(body.display_order)

    if (
      body.price_net !== undefined ||
      body.price_gross !== undefined
    ) {
      const priceInput = body.price_gross ?? body.price_net ?? 0
      const pricesIncludeVat = !!body.prices_include_vat

      const { data: conf } = await supabase
        .from('conferences')
        .select('pricing')
        .eq('id', conferenceId)
        .single()

      // Fee can override with body.vat_percentage; else use conference VAT
      const conferenceVat = (conf?.pricing as { vat_percentage?: number } | null)?.vat_percentage ?? 0
      const vatPct =
        body.vat_percentage != null && Number.isFinite(body.vat_percentage)
          ? Number(body.vat_percentage)
          : conferenceVat
      let price_net: number
      let price_gross: number
      if (vatPct > 0) {
        if (pricesIncludeVat) {
          price_gross = priceInput
          price_net = calculatePriceWithoutVAT(priceInput, vatPct)
        } else {
          price_net = priceInput
          price_gross = calculatePriceWithVAT(priceInput, vatPct)
        }
      } else {
        price_net = priceInput
        price_gross = priceInput
      }
      updates.price_net = Math.round(price_net * 100) / 100
      updates.price_gross = Math.round(price_gross * 100) / 100
    }

    const { data: updated, error } = await supabase
      .from('custom_registration_fees')
      .update(updates)
      .eq('id', feeId)
      .eq('conference_id', conferenceId)
      .select('*')
      .single()

    if (error) {
      log.error('Update registration fee error', { error, feeId })
      return NextResponse.json(
        { error: error.message || 'Failed to update fee' },
        { status: 500 }
      )
    }

    return NextResponse.json({ fee: updated })
  } catch (error) {
    return handleApiError(error, { action: 'update_registration_fee' })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: conferenceId, feeId } = await resolveParams(params)
    if (!conferenceId || !feeId) {
      return NextResponse.json(
        { error: 'Conference ID and Fee ID are required' },
        { status: 400 }
      )
    }
    await requireCanEditConference(conferenceId)
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('custom_registration_fees')
      .delete()
      .eq('id', feeId)
      .eq('conference_id', conferenceId)

    if (error) {
      log.error('Delete registration fee error', { error, feeId })
      return NextResponse.json(
        { error: error.message || 'Failed to delete fee' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, { action: 'delete_registration_fee' })
  }
}
