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
    const { registrationId, amount } = body

    if (!registrationId || !amount) {
      return NextResponse.json(
        { error: 'Missing registrationId or amount' },
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

    // Verify registration exists
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, email, first_name, last_name')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'eur',
      metadata: {
        registrationId,
        email: registration.email,
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

