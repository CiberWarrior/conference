import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import Stripe from 'stripe'

// Vercel serverless function configuration
export const runtime = 'nodejs'
export const maxDuration = 30 // seconds

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
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // Handle checkout session completed (for redirect-based payments)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const registrationId = session.metadata?.registrationId

    if (registrationId) {
      // Update payment status to paid
      const { error } = await supabase
        .from('registrations')
        .update({ payment_status: 'paid' })
        .eq('id', registrationId)

      if (error) {
        console.error('Failed to update payment status:', error)
        return NextResponse.json(
          { error: 'Failed to update payment status' },
          { status: 500 }
        )
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
          console.error('Registration not found:', regError)
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
          console.error('Failed to update registration:', updateError)
          return NextResponse.json(
            { error: 'Failed to update registration' },
            { status: 500 }
          )
        }
      } catch (invoiceError) {
        console.error('Error creating invoice:', invoiceError)
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
