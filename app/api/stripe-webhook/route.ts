import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import { sendPaymentConfirmation, sendWelcomeEmail } from '@/lib/email'
import Stripe from 'stripe'
import { log } from '@/lib/logger'

// Vercel serverless function configuration
export const runtime = 'nodejs'
export const maxDuration = 30 // seconds
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Missing STRIPE_WEBHOOK_SECRET' },
      { status: 500 }
    )
  }

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    log.error('Stripe webhook signature verification failed', err, {
      action: 'webhook_verification',
    })
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = await createServerClient()

  // Handle checkout session completed (for redirect-based payments)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    // Check if this is a subscription payment (from Payment Link)
    if (session.metadata?.inquiry_id) {
      return await handleSubscriptionPayment(session, supabase)
    }
    
    // Otherwise, it's a conference registration payment
    const registrationId = session.metadata?.registrationId

    if (registrationId) {
      // Get registration details for email
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', registrationId)
        .single()

      if (regError) {
        log.error('Failed to fetch registration for webhook', regError, {
          registrationId,
          eventType: 'checkout.session.completed',
        })
      }

      // Update payment status to paid
      const { error } = await supabase
        .from('registrations')
        .update({ payment_status: 'paid' })
        .eq('id', registrationId)

      if (error) {
        log.error('Failed to update payment status', error, {
          registrationId,
          eventType: 'checkout.session.completed',
        })
        return NextResponse.json(
          { error: 'Failed to update payment status' },
          { status: 500 }
        )
      }

      // Create payment history entry
      await supabase.from('payment_history').insert({
        registration_id: registrationId,
        transaction_type: 'payment',
        amount: (session.amount_total || 0) / 100, // Convert from cents
        currency: session.currency || 'usd',
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent as string,
        description: 'Payment completed via Stripe Checkout',
        metadata: { session_id: session.id },
      })

      // Send payment confirmation email
      if (registration) {
        sendPaymentConfirmation(
          registration.id,
          registration.email,
          registration.first_name,
          registration.last_name,
          registration.invoice_url || undefined
        ).catch((err) => {
          console.error('Failed to send payment confirmation email:', err)
        })
      }
    }
  }

  // Handle payment intent succeeded (for direct payments)
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const registrationId = paymentIntent.metadata?.registrationId

    if (registrationId) {
      try {
        // Get registration details
        const { data: registration, error: regError } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', registrationId)
          .single()

        if (regError || !registration) {
          log.error('Registration not found for payment intent', regError, {
            registrationId,
            paymentIntentId: paymentIntent.id,
            eventType: 'payment_intent.succeeded',
          })
          return NextResponse.json(
            { error: 'Registration not found' },
            { status: 404 }
          )
        }

        // Create or retrieve customer
        const customers = await stripe.customers.list({
          email: registration.email,
          limit: 1,
        })

        let customerId: string
        if (customers.data.length > 0) {
          customerId = customers.data[0].id
        } else {
          const customer = await stripe.customers.create({
            email: registration.email,
            name: `${registration.first_name} ${registration.last_name}`,
            metadata: {
              registrationId,
            },
          })
          customerId = customer.id
        }

        // Create invoice
        const invoice = await stripe.invoices.create({
          customer: customerId,
          collection_method: 'charge_automatically',
          auto_advance: false,
          metadata: {
            registrationId,
            paymentIntentId: paymentIntent.id,
          },
        })

        // Add invoice item
        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          description: 'Conference Registration Fee',
        })

        // Finalize invoice
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(
          invoice.id
        )

        const invoiceId = finalizedInvoice.id
        const invoiceUrl =
          finalizedInvoice.hosted_invoice_url ||
          finalizedInvoice.invoice_pdf ||
          null

        // Update registration with payment status and invoice info
        const { error: updateError } = await supabase
          .from('registrations')
          .update({
            payment_status: 'paid',
            invoice_id: invoiceId,
            invoice_url: invoiceUrl,
          })
          .eq('id', registrationId)

        if (updateError) {
          log.error('Failed to update registration', updateError, {
            registrationId,
            paymentIntentId: paymentIntent.id,
            eventType: 'payment_intent.succeeded',
          })
          return NextResponse.json(
            { error: 'Failed to update registration' },
            { status: 500 }
          )
        }

        // Create payment history entry
        await supabase.from('payment_history').insert({
          registration_id: registrationId,
          transaction_type: 'payment',
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          status: 'completed',
          stripe_payment_intent_id: paymentIntent.id,
          description: `Payment completed - Invoice ${finalizedInvoice.number || invoiceId}`,
          metadata: { invoice_id: invoiceId, payment_intent_id: paymentIntent.id },
        })

        // Send payment confirmation email
        sendPaymentConfirmation(
          registration.id,
          registration.email,
          registration.first_name,
          registration.last_name,
          invoiceUrl || undefined
        ).catch((err) => {
          log.error('Failed to send payment confirmation email', err, {
            registrationId,
            email: registration.email,
            eventType: 'payment_intent.succeeded',
          })
        })
      } catch (invoiceError) {
        log.error('Error creating invoice', invoiceError, {
          registrationId,
          paymentIntentId: paymentIntent.id,
          eventType: 'payment_intent.succeeded',
        })
        // Still update payment status even if invoice creation fails
        await supabase
          .from('registrations')
          .update({ payment_status: 'paid' })
          .eq('id', registrationId)
      }
    }
  }

  return NextResponse.json({ received: true })
}

/**
 * Handle subscription payment from Payment Link
 * Auto-creates Conference Admin user and sends credentials
 */
async function handleSubscriptionPayment(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  try {
    const inquiryId = session.metadata!.inquiry_id
    const planId = session.metadata!.plan_id
    const billingCycle = session.metadata!.billing_cycle as 'monthly' | 'yearly'
    const customerEmail = session.metadata!.customer_email
    const customerName = session.metadata!.customer_name
    const organization = session.metadata!.organization

    log.info('Processing subscription payment', {
      inquiryId,
      planId,
      customerEmail,
      sessionId: session.id,
    })

    // Get inquiry details
    const { data: inquiry, error: inquiryError } = await supabase
      .from('contact_inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single()

    if (inquiryError || !inquiry) {
      log.error('Inquiry not found for subscription payment', inquiryError, {
        inquiryId,
        sessionId: session.id,
      })
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users?.find((u: any) => u.email === customerEmail)

    let userId: string

    if (userExists) {
      userId = userExists.id
      log.info('User already exists, using existing user', { userId, email: customerEmail })
    } else {
      // Create Conference Admin user in Supabase Auth
      const tempPassword = generateSecurePassword()
      
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: customerName,
          organization: organization,
          created_via: 'subscription_payment',
        },
      })

      if (createUserError || !newUser.user) {
        log.error('Failed to create user', createUserError, {
          email: customerEmail,
          inquiryId,
        })
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      userId = newUser.user.id

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: customerEmail,
          full_name: customerName,
          role: 'conference_admin',
          active: true,
          organization: organization,
        })

      if (profileError) {
        log.error('Failed to create user profile', profileError, {
          userId,
          email: customerEmail,
        })
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }

      // Send welcome email with credentials
      try {
        await sendWelcomeEmail(
          customerEmail,
          customerName,
          tempPassword,
          'Conference Platform'
        )
        log.info('Welcome email sent successfully', {
          userId,
          email: customerEmail,
        })
      } catch (emailError) {
        log.error('Failed to send welcome email', emailError, {
          userId,
          email: customerEmail,
        })
      }
      
      log.info('New Conference Admin user created', {
        userId,
        email: customerEmail,
        tempPassword: '[REDACTED]',
      })
    }

    // Calculate subscription dates
    const startsAt = new Date()
    const expiresAt = new Date()
    if (billingCycle === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    // Create subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        inquiry_id: inquiryId,
        status: 'active',
        billing_cycle: billingCycle,
        price: (session.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || 'EUR',
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_invoice_id: session.invoice as string,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (subError) {
      log.error('Failed to create subscription', subError, {
        userId,
        planId,
        inquiryId,
      })
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    // Update payment offer status
    await supabase
      .from('payment_offers')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('inquiry_id', inquiryId)
      .eq('status', 'sent')

    // Mark inquiry as converted
    await supabase
      .from('contact_inquiries')
      .update({
        status: 'converted',
        converted: true,
        converted_at: new Date().toISOString(),
      })
      .eq('id', inquiryId)

    log.info('Subscription created successfully', {
      subscriptionId: subscription.id,
      userId,
      inquiryId,
      planId,
    })

    return NextResponse.json({ received: true, subscriptionId: subscription.id })
  } catch (error) {
    log.error('Error handling subscription payment', error, {
      sessionId: session.id,
    })
    return NextResponse.json({ error: 'Failed to process subscription payment' }, { status: 500 })
  }
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const values = crypto.getRandomValues(new Uint8Array(length))
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length]
  }
  return password
}
