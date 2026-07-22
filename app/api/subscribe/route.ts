import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError } from '@/lib/api-error'
import { stripe } from '@/lib/stripe'
import { log } from '@/lib/logger'
import { getClientIP } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const subscribeSchema = z.object({
  planSlug: z.string().min(1).max(100),
  billingCycle: z.enum(['monthly', 'yearly']),
  paymentMethod: z.enum(['card', 'bank_transfer']),
  fullName: z.string().min(2).max(200),
  email: z.string().email().max(255),
  organization: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
})

function buildPaymentReference(orderId: string): string {
  return `MF-${orderId.replace(/-/g, '').slice(0, 10).toUpperCase()}`
}

/**
 * POST /api/subscribe
 * Public self-service checkout for platform subscription plans.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = subscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      planSlug,
      billingCycle,
      paymentMethod,
      fullName,
      email,
      organization,
      phone,
    } = parsed.data

    const supabase = createAdminClient()

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', planSlug)
      .eq('active', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const price =
      billingCycle === 'monthly' ? Number(plan.price_monthly) : Number(plan.price_yearly)
    const currency = plan.currency || 'EUR'

    if (paymentMethod === 'card' && !stripe) {
      return NextResponse.json(
        {
          error:
            'Card payments are not configured yet. Please choose bank transfer or contact us.',
        },
        { status: 503 }
      )
    }

    let bankSettings: {
      bank_account_number: string | null
      bank_account_holder: string | null
      bank_name: string | null
      swift_bic: string | null
      bank_address: string | null
      bank_currency: string | null
      bank_transfer_enabled: boolean
      payment_note: string | null
    } | null = null

    if (paymentMethod === 'bank_transfer') {
      const { data: settings } = await supabase
        .from('platform_settings')
        .select(
          'bank_account_number, bank_account_holder, bank_name, swift_bic, bank_address, bank_currency, bank_transfer_enabled, payment_note'
        )
        .eq('id', 1)
        .maybeSingle()

      bankSettings = settings
      if (
        !settings?.bank_transfer_enabled ||
        !settings.bank_account_number
      ) {
        return NextResponse.json(
          {
            error:
              'Bank transfer is not available yet. Please choose card payment or contact us.',
          },
          { status: 503 }
        )
      }
    }

    // Placeholder reference; updated after insert with real order id
    const { data: order, error: orderError } = await supabase
      .from('subscription_orders')
      .insert({
        plan_id: plan.id,
        billing_cycle: billingCycle,
        price,
        currency,
        full_name: fullName,
        email: email.toLowerCase().trim(),
        organization: organization || null,
        phone: phone || null,
        payment_method: paymentMethod,
        status: 'pending',
        payment_reference: 'PENDING',
      })
      .select()
      .single()

    if (orderError || !order) {
      log.error('Failed to create subscription order', orderError, {
        planSlug,
        email,
        ip: getClientIP(request),
      })
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    const paymentReference = buildPaymentReference(order.id)
    await supabase
      .from('subscription_orders')
      .update({ payment_reference: paymentReference })
      .eq('id', order.id)

    if (paymentMethod === 'bank_transfer') {
      return NextResponse.json({
        orderId: order.id,
        paymentMethod: 'bank_transfer',
        plan: {
          name: plan.name,
          slug: plan.slug,
          billingCycle,
          price,
          currency,
        },
        bankInstructions: {
          recipient: bankSettings!.bank_account_holder,
          iban: bankSettings!.bank_account_number,
          bankName: bankSettings!.bank_name,
          swift: bankSettings!.swift_bic,
          address: bankSettings!.bank_address,
          amount: price,
          currency: bankSettings!.bank_currency || currency,
          reference: paymentReference,
          note: bankSettings!.payment_note,
        },
      })
    }

    // Card → Stripe Checkout Session (one-time payment for the selected cycle)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    let productId = plan.stripe_product_id as string | null
    if (!productId) {
      const product = await stripe!.products.create({
        name: `${plan.name} Plan`,
        description: plan.description || undefined,
      })
      productId = product.id
      await supabase
        .from('subscription_plans')
        .update({ stripe_product_id: productId })
        .eq('id', plan.id)
    }

    const stripePrice = await stripe!.prices.create({
      product: productId,
      unit_amount: Math.round(price * 100),
      currency: currency.toLowerCase(),
    })

    const session = await stripe!.checkout.sessions.create({
      mode: 'payment',
      customer_email: email.toLowerCase().trim(),
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      success_url: `${appUrl}/subscription/success?email=${encodeURIComponent(email)}&order=${order.id}`,
      cancel_url: `${appUrl}/subscribe?plan=${plan.slug}&cycle=${billingCycle}&canceled=1`,
      metadata: {
        order_id: order.id,
        plan_id: plan.id,
        billing_cycle: billingCycle,
        customer_email: email.toLowerCase().trim(),
        customer_name: fullName,
        organization: organization || '',
        source: 'self_service_subscribe',
      },
    })

    await supabase
      .from('subscription_orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id)

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create Stripe checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      orderId: order.id,
      paymentMethod: 'card',
      checkoutUrl: session.url,
    })
  } catch (error) {
    return handleApiError(error, { action: 'subscribe' })
  }
}
