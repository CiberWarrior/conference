/**
 * Admin: list and create custom registration fees for a conference.
 * GET → getFeesForAdmin
 * POST → create fee (compute net/gross from conference VAT)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireCanEditConference } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'
import { getFeesForAdmin } from '@/lib/custom-registration-fees'
import { calculatePriceWithVAT, calculatePriceWithoutVAT } from '@/utils/pricing'
import type { CustomRegistrationFeeInput } from '@/types/custom-registration-fee'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolved = await Promise.resolve(params)
    const conferenceId = resolved?.id
    if (!conferenceId) {
      return NextResponse.json({ error: 'Conference ID is required' }, { status: 400 })
    }
    await requireCanEditConference(conferenceId)
    const supabase = createAdminClient()
    const fees = await getFeesForAdmin(supabase, conferenceId)
    return NextResponse.json({ fees }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    return handleApiError(error, { action: 'list_registration_fees' })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  let conferenceId: string | undefined
  try {
    const resolved = await Promise.resolve(params)
    conferenceId = resolved?.id
    if (!conferenceId) {
      return NextResponse.json({ error: 'Conference ID is required' }, { status: 400 })
    }
    await requireCanEditConference(conferenceId)

    let supabase
    try {
      supabase = createAdminClient()
    } catch (adminErr) {
      const msg =
        adminErr instanceof Error ? adminErr.message : 'Server configuration error'
      log.error('Admin client init failed', { error: msg, conferenceId })
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'development'
              ? msg
              : 'Server configuration error. Check SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 503 }
      )
    }

    let body: CustomRegistrationFeeInput
    try {
      body = (await request.json()) as CustomRegistrationFeeInput
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body (expected JSON)' },
        { status: 400 }
      )
    }
    const {
      name,
      valid_from,
      valid_to,
      is_active,
      price_net: body_price_net,
      price_gross: body_price_gross,
      prices_include_vat,
      vat_percentage: body_vat_percentage,
      capacity,
      currency,
      display_order,
    } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    if (!valid_from || !valid_to) {
      return NextResponse.json(
        { error: 'Valid from and valid to are required' },
        { status: 400 }
      )
    }
    if (valid_to < valid_from) {
      return NextResponse.json(
        { error: 'Valid to must be on or after valid from' },
        { status: 400 }
      )
    }

    // Ensure date format YYYY-MM-DD for Postgres DATE
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(valid_from) || !dateRegex.test(valid_to)) {
      return NextResponse.json(
        { error: 'Valid from and valid to must be dates in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // Get conference VAT for net/gross computation
    const { data: conference, error: confErr } = await supabase
      .from('conferences')
      .select('pricing')
      .eq('id', conferenceId)
      .single()

    if (confErr || !conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    const pricing = (conference as { pricing?: { vat_percentage?: number | null; currency?: string } | null })
      .pricing
    // Fee can override with body.vat_percentage (e.g. different country); else use conference VAT
    const vatPct =
      body_vat_percentage != null && Number.isFinite(body_vat_percentage)
        ? Number(body_vat_percentage)
        : Number(pricing?.vat_percentage) || 0
    const confCurrency =
      (typeof pricing?.currency === 'string' ? pricing.currency : null) ?? currency ?? 'EUR'

    const priceInput = body_price_gross ?? body_price_net ?? 0
    const pricesIncludeVat = !!prices_include_vat
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

    const maxOrderResult = await supabase
      .from('custom_registration_fees')
      .select('display_order')
      .eq('conference_id', conferenceId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder =
      display_order != null && Number.isFinite(display_order)
        ? display_order
        : (maxOrderResult.data?.display_order ?? -1) + 1

    const { data: inserted, error } = await supabase
      .from('custom_registration_fees')
      .insert({
        conference_id: conferenceId,
        name: name.trim(),
        valid_from,
        valid_to,
        is_active: !!is_active,
        price_net: Math.round(price_net * 100) / 100,
        price_gross: Math.round(price_gross * 100) / 100,
        capacity:
          capacity == null || (typeof capacity === 'string' && capacity === '')
            ? null
            : Number(capacity),
        currency: confCurrency,
        display_order: nextOrder,
      })
      .select('*')
      .single()

    if (error) {
      log.error('Create registration fee error', {
        error: error.message,
        code: error.code,
        details: error.details,
        conferenceId,
      })
      const message =
        process.env.NODE_ENV === 'development' && error.details
          ? `${error.message} (${JSON.stringify(error.details)})`
          : error.message || 'Failed to create fee'
      return NextResponse.json(
        { error: message },
        { status: 500 }
      )
    }

    if (!inserted) {
      log.error('Create registration fee: no row returned', { conferenceId })
      return NextResponse.json(
        { error: 'Failed to create fee (no data returned)' },
        { status: 500 }
      )
    }

    log.info('Registration fee created', { feeId: inserted.id, conferenceId })
    return NextResponse.json({ fee: inserted })
  } catch (error) {
    log.error('Create registration fee exception', {
      error,
      conferenceId: conferenceId ?? 'unknown',
    })
    return handleApiError(error, { action: 'create_registration_fee' })
  }
}
