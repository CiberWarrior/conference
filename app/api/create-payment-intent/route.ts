import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import {
  paymentIntentRateLimit,
  getClientIP,
  checkRateLimit,
  createRateLimitHeaders,
} from '@/lib/rate-limit'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit(
      paymentIntentRateLimit,
      ip
    )

    if (rateLimitResult && !rateLimitResult.success) {
      const retryAfter = Math.ceil(
        (rateLimitResult.reset - Date.now()) / 1000
      )
      log.warn('Rate limit exceeded for payment intent', {
        ip,
        retryAfter,
        action: 'payment_intent_rate_limit',
      })
      return NextResponse.json(
        {
          error: `Too many payment requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const body = await request.json()
    const { registrationId, amount: clientAmount } = body

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Missing registrationId' },
        { status: 400 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const supabase = await createServerClient()

    // Load registration (conference_id, registration_fee_id for amount)
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, email, conference_id, registration_fee_id')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Amount: from client or from custom_registration_fees (registration_fee_id only)
    let amountCents: number
    let currency: string = 'eur'
    if (
      clientAmount != null &&
      typeof clientAmount === 'number' &&
      clientAmount > 0
    ) {
      amountCents = Math.round(clientAmount * 100)
    } else {
      let amount = 0
      let curr = 'EUR'
      const registrationFeeId = (registration as { registration_fee_id?: string | null })
        .registration_fee_id
      if (registrationFeeId) {
        const { data: feeRow, error: feeErr } = await supabase
          .from('custom_registration_fees')
          .select('id, price_gross, currency')
          .eq('id', registrationFeeId)
          .eq('conference_id', registration.conference_id)
          .single()
        if (!feeErr && feeRow && Number(feeRow.price_gross) > 0) {
          amount = Number(feeRow.price_gross)
          curr = (feeRow.currency as string) || 'EUR'
        }
      }
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'No amount to charge for this registration' },
          { status: 400 }
        )
      }
      amountCents = Math.round(amount * 100)
      currency = curr.toLowerCase()
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency === 'eur' ? 'eur' : currency,
      metadata: {
        registrationId,
        email: registration.email ?? '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Update registration with payment intent ID
    await supabase
      .from('registrations')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', registrationId)

    const headers = rateLimitResult
      ? createRateLimitHeaders(rateLimitResult)
      : {}

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountCents / 100,
        currency: currency.toUpperCase(),
      },
      { headers }
    )
  } catch (error) {
    log.error('Error creating payment intent', error, {
      action: 'create_payment_intent',
    })
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

