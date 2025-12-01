import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'

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

    const supabase = await createServerClient()

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

    // Create invoice
    let invoiceId: string | null = null
    let invoiceUrl: string | null = null

    try {
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
          paymentIntentId,
        },
      })

      // Add invoice item
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: paymentIntent.amount,
        currency: 'eur',
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
          invoice_id: invoiceId,
          invoice_url: invoiceUrl,
        })
        .eq('id', registrationId)
    } catch (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      // Still update payment status even if invoice creation fails
      await supabase
        .from('registrations')
        .update({ payment_status: 'paid' })
        .eq('id', registrationId)
    }

    return NextResponse.json({
      success: true,
      invoiceId,
      invoiceUrl,
    })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

