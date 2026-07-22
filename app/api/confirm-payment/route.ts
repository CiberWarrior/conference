import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, registrationId } = body

    if (!paymentIntentId || !registrationId) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId or registrationId' },
        { status: 400 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    // Retrieve payment intent to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Security: verify the payment intent belongs to this registration
    if (paymentIntent.metadata?.registrationId !== registrationId) {
      log.warn('Payment intent registrationId mismatch', {
        paymentIntentId,
        expectedRegistrationId: registrationId,
        actualRegistrationId: paymentIntent.metadata?.registrationId,
        action: 'confirm_payment_security',
      })
      return NextResponse.json(
        { error: 'Payment does not match registration' },
        { status: 400 }
      )
    }

    // Public/anonymous endpoint - registrations RLS is admin-scoped (migration 056),
    // so this must use the service role client.
    const supabase = createAdminClient()

    // Get registration details
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Idempotency guard: the Stripe webhook (payment_intent.succeeded) may already
    // have processed this payment (created the invoice, sent the confirmation email)
    // before this client-side call arrives. Avoid creating a second Stripe invoice.
    if (registration.payment_status === 'paid' && registration.invoice_id) {
      log.info('Payment already confirmed (likely by webhook), skipping duplicate invoice', {
        registrationId,
        paymentIntentId,
        action: 'confirm_payment_idempotent',
      })
      return NextResponse.json({
        success: true,
        invoiceId: registration.invoice_id,
        invoiceUrl: registration.invoice_url,
      })
    }

    // Create invoice
    let invoiceId: string | null = null
    let invoiceUrl: string | null = null

    try {
      // Create or retrieve customer
      const customers = await stripe.customers.list({
        email: registration.email,
        limit: 1,
      })

      // Derive name/email from custom_data when legacy fields are null
      const customerEmail =
        registration.email || registration.custom_data?.email || ''
      const customerFirstName =
        registration.first_name ||
        registration.custom_data?.first_name ||
        registration.custom_data?.firstName ||
        ''
      const customerLastName =
        registration.last_name ||
        registration.custom_data?.last_name ||
        registration.custom_data?.lastName ||
        ''
      const customerName = `${customerFirstName} ${customerLastName}`.trim() || customerEmail

      let customerId: string
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
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
          paymentIntentId,
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
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

      invoiceId = finalizedInvoice.id
      invoiceUrl = finalizedInvoice.hosted_invoice_url || finalizedInvoice.invoice_pdf || null

      // Update registration with payment status and invoice info
      await supabase
        .from('registrations')
        .update({
          payment_status: 'paid',
          payment_method: 'card',
          payment_amount: paymentIntent.amount / 100,
          payment_currency: paymentIntent.currency.toUpperCase(),
          invoice_id: invoiceId,
          invoice_url: invoiceUrl,
        })
        .eq('id', registrationId)
    } catch (invoiceError) {
      log.error('Error creating invoice', invoiceError, {
        registrationId,
        paymentIntentId,
        action: 'create_invoice',
      })
      // Still update payment status even if invoice creation fails
      await supabase
        .from('registrations')
        .update({
          payment_status: 'paid',
          payment_method: 'card',
          payment_amount: paymentIntent.amount / 100,
          payment_currency: paymentIntent.currency.toUpperCase(),
        })
        .eq('id', registrationId)
    }

    return NextResponse.json({
      success: true,
      invoiceId,
      invoiceUrl,
    })
  } catch (error) {
    log.error('Error confirming payment', error, {
      action: 'confirm_payment',
    })
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

