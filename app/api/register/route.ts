import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/stripe'
import type { PaymentStatus } from '@/types/registration'

const registrationSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  paymentRequired: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registrationSchema.parse(body)

    const supabase = createServerClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Determine payment status
    const paymentStatus: PaymentStatus = validatedData.paymentRequired
      ? 'pending'
      : 'not_required'

    // Insert registration
    const { data: registration, error: insertError } = await supabase
      .from('registrations')
      .insert({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        payment_required: validatedData.paymentRequired,
        payment_status: paymentStatus,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save registration' },
        { status: 500 }
      )
    }

    let paymentUrl: string | undefined
    let stripeSessionId: string | null = null

    // Create Stripe checkout session if payment is required
    if (validatedData.paymentRequired) {
      try {
        // Default amount - should be configurable
        const amount = 50 // 50 EUR default
        const session = await createCheckoutSession({
          registrationId: registration.id,
          email: validatedData.email,
          amount,
        })

        stripeSessionId = session.id
        paymentUrl = session.url || undefined

        // Update registration with Stripe session ID
        await supabase
          .from('registrations')
          .update({ stripe_session_id: session.id })
          .eq('id', registration.id)
      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        // Continue even if Stripe fails - registration is saved
      }
    }

    // Trigger email confirmation (async, don't wait)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          registrationId: registration.id,
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          paymentUrl,
        }),
      }).catch((err) => {
        console.error('Failed to trigger email:', err)
      })
    }

    return NextResponse.json({
      success: true,
      message: validatedData.paymentRequired
        ? 'Registration successful! Please proceed to payment.'
        : 'Registration successful! You will receive a confirmation email shortly.',
      paymentUrl,
      registrationId: registration.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

