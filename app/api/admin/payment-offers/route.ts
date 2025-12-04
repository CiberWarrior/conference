import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { log } from '@/lib/logger'
import type { CreatePaymentOfferRequest } from '@/types/subscription'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/payment-offers
 * Create a payment offer and generate Stripe Payment Link
 * Super Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify user is Super Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    const body: CreatePaymentOfferRequest = await request.json()
    const { inquiryId, planId, billingCycle, customPrice, discountPercent = 0 } = body

    if (!stripe) {
      log.warn('Stripe not configured - payment offer creation attempted', {
        userId: user.id,
        inquiryId,
      })
      return NextResponse.json({ 
        error: 'Stripe payment processing is not yet configured. Please contact the administrator.' 
      }, { status: 503 })
    }

    // Validate required fields
    if (!inquiryId || !planId || !billingCycle) {
      return NextResponse.json({ 
        error: 'Missing required fields: inquiryId, planId, billingCycle' 
      }, { status: 400 })
    }

    // Get inquiry details
    const { data: inquiry, error: inquiryError } = await supabase
      .from('contact_inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single()

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Get subscription plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 })
    }

    // Calculate final price
    const basePrice = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
    const price = customPrice || basePrice
    const discountAmount = (price * discountPercent) / 100
    const finalPrice = price - discountAmount

    // Get or create Stripe Price
    let stripePriceId: string | null = null
    
    // First, try to use existing price ID from plan
    if (billingCycle === 'monthly' && plan.stripe_price_id_monthly) {
      stripePriceId = plan.stripe_price_id_monthly
    } else if (billingCycle === 'yearly' && plan.stripe_price_id_yearly) {
      stripePriceId = plan.stripe_price_id_yearly
    }

    // If no existing price ID or custom price/discount, create a new price
    if (!stripePriceId || customPrice || discountPercent > 0) {
      // Get or create product
      let productId = plan.stripe_product_id
      if (!productId) {
        const product = await stripe.products.create({
          name: `${plan.name} Plan`,
          description: plan.description || undefined,
        })
        productId = product.id
        
        // Update plan with product ID
        await supabase
          .from('subscription_plans')
          .update({ stripe_product_id: productId })
          .eq('id', planId)
      }

      // Create new price with custom amount
      const stripePrice = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(finalPrice * 100), // Convert to cents
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: billingCycle === 'monthly' ? 'month' : 'year',
        },
      })
      stripePriceId = stripePrice.id
    }

    // Create Stripe Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        },
      },
      metadata: {
        inquiry_id: inquiryId,
        plan_id: planId,
        billing_cycle: billingCycle,
        customer_email: inquiry.email,
        customer_name: inquiry.name,
        organization: inquiry.organization,
        offer_created_by: user.id,
      },
      customer_creation: 'always',
      allow_promotion_codes: true,
    })

    // Save payment offer to database
    const { data: offer, error: offerError } = await supabase
      .from('payment_offers')
      .insert({
        inquiry_id: inquiryId,
        plan_id: planId,
        created_by: user.id,
        billing_cycle: billingCycle,
        custom_price: customPrice || null,
        discount_percent: discountPercent,
        stripe_payment_link_id: paymentLink.id,
        stripe_payment_link_url: paymentLink.url,
        status: 'sent',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (offerError) {
      log.error('Failed to save payment offer', offerError, {
        inquiryId,
        planId,
        userId: user.id,
      })
      return NextResponse.json({ 
        error: 'Failed to save payment offer' 
      }, { status: 500 })
    }

    // Update inquiry status to 'qualified' if not already converted
    if (inquiry.status !== 'converted') {
      await supabase
        .from('contact_inquiries')
        .update({ 
          status: 'qualified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', inquiryId)
    }

    // TODO: Send email to customer with payment link
    // await sendPaymentOfferEmail(inquiry, plan, paymentLink.url, billingCycle, finalPrice)

    log.info('Payment offer created successfully', {
      offerId: offer.id,
      inquiryId,
      planId,
      userId: user.id,
      finalPrice,
    })

    return NextResponse.json({
      success: true,
      offerId: offer.id,
      paymentLinkUrl: paymentLink.url,
      message: 'Payment offer created successfully',
    })
  } catch (error) {
    log.error('Error creating payment offer', error, {
      action: 'create_payment_offer',
    })
    return NextResponse.json({ 
      error: 'Failed to create payment offer' 
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/payment-offers?inquiryId=xxx
 * Get payment offers for an inquiry
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify user is Super Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inquiryId = searchParams.get('inquiryId')

    if (!inquiryId) {
      return NextResponse.json({ error: 'Missing inquiryId parameter' }, { status: 400 })
    }

    const { data: offers, error } = await supabase
      .from('payment_offers')
      .select(`
        *,
        subscription_plans (
          name,
          slug,
          description
        ),
        user_profiles!created_by (
          email,
          full_name
        )
      `)
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: false })

    if (error) {
      log.error('Failed to fetch payment offers', error, {
        inquiryId,
        userId: user.id,
      })
      return NextResponse.json({ 
        error: 'Failed to fetch payment offers' 
      }, { status: 500 })
    }

    return NextResponse.json({ offers })
  } catch (error) {
    log.error('Error fetching payment offers', error)
    return NextResponse.json({ 
      error: 'Failed to fetch payment offers' 
    }, { status: 500 })
  }
}

