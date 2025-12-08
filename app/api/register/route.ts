import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/stripe'
import { sendRegistrationConfirmation } from '@/lib/email'
import type { PaymentStatus } from '@/types/registration'
import { log } from '@/lib/logger'
import {
  registrationRateLimit,
  getClientIP,
  checkRateLimit,
  createRateLimitHeaders,
} from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

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
    accompanyingPersons: z.boolean({
      required_error: 'Please indicate if you will bring accompanying persons',
    }),
    accompanyingPersonsData: z
      .array(
        z.object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          arrivalDate: z.string().min(1, 'Arrival date is required'),
          departureDate: z.string().min(1, 'Departure date is required'),
        })
      )
      .optional(),
    galaDinner: z.boolean({
      required_error: 'Please indicate if you will attend Gala Dinner',
    }),
    presentationType: z.boolean({
      required_error: 'Please indicate if you intend to have poster/spoken presentation',
    }),
    abstractSubmission: z.boolean({
      required_error: 'Please indicate if you will submit an abstract',
    }),
    conferenceId: z.string().uuid().optional(),
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
  .refine(
    (data) => {
      if (data.accompanyingPersons === true) {
        if (
          !data.accompanyingPersonsData ||
          data.accompanyingPersonsData.length === 0
        ) {
          return false
        }
        // Validate each accompanying person
        return data.accompanyingPersonsData.every((person) => {
          if (!person.firstName || !person.lastName) return false
          if (!person.arrivalDate || !person.departureDate) return false
          return new Date(person.departureDate) >= new Date(person.arrivalDate)
        })
      }
      return true
    },
    {
      message:
        'Please add at least one accompanying person with complete details (name, surname, arrival and departure dates)',
      path: ['accompanyingPersons'],
    }
  )

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit(registrationRateLimit, ip)

    if (rateLimitResult && !rateLimitResult.success) {
      const retryAfter = Math.ceil(
        (rateLimitResult.reset - Date.now()) / 1000
      )
      log.warn('Rate limit exceeded for registration', {
        ip,
        retryAfter,
        action: 'registration_rate_limit',
      })
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const body = await request.json()
    const validatedData = registrationSchema.parse(body)

    const supabase = await createServerClient()

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

    // Verify conference exists if conferenceId is provided
    if (validatedData.conferenceId) {
      const { data: conference, error: confError } = await supabase
        .from('conferences')
        .select('id, settings')
        .eq('id', validatedData.conferenceId)
        .eq('published', true)
        .eq('active', true)
        .single()

      if (confError || !conference) {
        return NextResponse.json(
          { error: 'Conference not found or not available' },
          { status: 404 }
        )
      }

      // Check if registration is enabled for this conference
      const settings = conference.settings || {}
      if (settings.registration_enabled === false) {
        return NextResponse.json(
          { error: 'Registration is not enabled for this conference' },
          { status: 403 }
        )
      }
    }

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
        accompanying_persons: validatedData.accompanyingPersons,
        accompanying_persons_data: validatedData.accompanyingPersonsData || [],
        gala_dinner: validatedData.galaDinner,
        presentation_type: validatedData.presentationType,
        abstract_submission: validatedData.abstractSubmission,
        payment_status: paymentStatus,
        conference_id: validatedData.conferenceId || null,
      })
      .select()
      .single()

    if (insertError) {
      log.error('Registration database error', insertError, {
        email: validatedData.email,
        action: 'create_registration',
        errorDetails: insertError,
      })
      return NextResponse.json(
        { 
          error: 'Failed to save registration',
          details: insertError.message || 'Database error occurred',
          code: insertError.code,
        },
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
        log.error('Stripe checkout session creation failed', stripeError, {
          registrationId: registration.id,
          email: validatedData.email,
          action: 'create_checkout_session',
        })
        // Continue even if Stripe fails - registration is saved
      }
    }

    // Get conference name if conferenceId is provided
    let conferenceName: string | undefined
    if (validatedData.conferenceId) {
      const { data: conference } = await supabase
        .from('conferences')
        .select('name, start_date, location')
        .eq('id', validatedData.conferenceId)
        .single()
      conferenceName = conference?.name
    }

    // Trigger email confirmation (async, don't wait)
    sendRegistrationConfirmation(
      registration.id,
      validatedData.email,
      validatedData.firstName,
      validatedData.lastName,
      paymentUrl
    ).catch((err) => {
      log.error('Failed to send registration confirmation email', err, {
        registrationId: registration.id,
        email: validatedData.email,
        action: 'send_confirmation_email',
      })
    })

    const headers = rateLimitResult
      ? createRateLimitHeaders(rateLimitResult)
      : {}

    return NextResponse.json(
      {
        success: true,
        message: validatedData.paymentRequired
          ? 'Registration successful! Please proceed to payment.'
          : 'Registration successful! You will receive a confirmation email shortly.',
        paymentUrl,
        registrationId: registration.id,
      },
      { headers }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      )
    }

    log.error('Registration error', error, {
      action: 'register',
    })
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

