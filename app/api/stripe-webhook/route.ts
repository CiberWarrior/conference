import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import { sendPaymentConfirmation } from '@/lib/email'
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
