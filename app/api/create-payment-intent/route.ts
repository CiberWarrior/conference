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
import { getRegistrationChargeAmount } from '@/utils/pricing'

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

    // Load registration (need conference_id + registration_fee_type when amount not sent)
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, email, first_name, last_name, conference_id, registration_fee_type')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Amount: from client (legacy) or server-computed from registration + conference pricing
    let amountCents: number
    let currency: string = 'eur'
    if (
      clientAmount != null &&
      typeof clientAmount === 'number' &&
      clientAmount > 0
    ) {
      amountCents = Math.round(clientAmount * 100)
    } else {
      const { data: conference } = await supabase
        .from('conferences')
        .select('pricing, start_date')
        .eq('id', registration.conference_id)
        .single()
      let feeTypeUsage: Record<string, number> = {}
      try {
        const { data: regs } = await supabase
          .from('registrations')
          .select('registration_fee_type')
          .eq('conference_id', registration.conference_id)
          .not('registration_fee_type', 'is', null)
        for (const row of regs || []) {
          const ft = row.registration_fee_type as string
          if (ft) feeTypeUsage[ft] = (feeTypeUsage[ft] || 0) + 1
        }
      } catch {
        // ignore
      }
      const { amount, currency: curr } = getRegistrationChargeAmount(
        {
          registration_fee_type: registration.registration_fee_type ?? null,
        },
        {
          pricing: conference?.pricing ?? null,
          start_date: conference?.start_date ?? null,
        },
        feeTypeUsage
      )
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'No amount to charge for this registration' },
          { status: 400 }
        )
      }
      amountCents = Math.round(amount * 100)
      currency = (curr || 'EUR').toLowerCase()
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

