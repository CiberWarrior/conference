import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/stripe'
import { sendRegistrationConfirmation } from '@/lib/email'
import type { PaymentStatus } from '@/types/registration'

const registrationSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(5),
    country: z.string().min(2),
    institution: z.string().min(2),
    arrivalDate: z.string().min(1),
    departureDate: z.string().min(1),
    paymentRequired: z.boolean(),
    paymentByCard: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.arrivalDate && data.departureDate) {
        return new Date(data.departureDate) >= new Date(data.arrivalDate)
      }
      return true
    },
    {
      message: 'Departure date must be after or equal to arrival date',
      path: ['departureDate'],
    }
  )

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
        country: validatedData.country,
        institution: validatedData.institution,
        arrival_date: validatedData.arrivalDate,
        departure_date: validatedData.departureDate,
        payment_required: validatedData.paymentRequired,
        payment_by_card: validatedData.paymentByCard,
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

    // Create Stripe checkout session if payment is required but NOT by card (fallback for non-card payments)
    // If paymentByCard is true, we'll use direct payment in the form instead
    if (validatedData.paymentRequired && !validatedData.paymentByCard) {
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
    sendRegistrationConfirmation(
      registration.id,
      validatedData.email,
      validatedData.firstName,
      validatedData.lastName,
      paymentUrl
    ).catch((err) => {
      console.error('Failed to send registration confirmation email:', err)
    })

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

