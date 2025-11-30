import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

