import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/refunds
 * Process a refund request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, amount, reason, processRefund = false } = body

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get registration
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

    // Check if payment was made
    if (registration.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Registration is not paid, cannot process refund' },
        { status: 400 }
      )
    }

    // If just requesting refund (not processing)
    if (!processRefund) {
      const refundAmount = amount || 0 // You may want to calculate this from payment history

      const { data: updated, error: updateError } = await supabase
        .from('registrations')
        .update({
          refund_requested: true,
          refund_amount: refundAmount,
          refund_reason: reason || '',
          refund_status: 'requested',
          refund_requested_at: new Date().toISOString(),
        })
        .eq('id', registrationId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to request refund' },
          { status: 500 }
        )
      }

      // Create payment history entry
      await supabase.from('payment_history').insert({
        registration_id: registrationId,
        transaction_type: 'refund',
        amount: -refundAmount,
        status: 'pending',
        description: `Refund requested: ${reason || 'No reason provided'}`,
        metadata: { reason },
      })

      return NextResponse.json({
        success: true,
        message: 'Refund requested successfully',
        refund: updated,
      })
    }

    // Process refund through Stripe
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    if (!registration.payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment intent found for this registration' },
        { status: 400 }
      )
    }

    const refundAmount = amount || undefined // If not specified, full refund

    try {
      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: registration.payment_intent_id,
        amount: refundAmount ? Math.round(refundAmount * 100) : undefined, // Convert to cents
        reason: reason ? (reason.toLowerCase().includes('fraud') ? 'fraudulent' : 'requested_by_customer') : undefined,
      })

      // Update registration
      const { data: updated, error: updateError } = await supabase
        .from('registrations')
        .update({
          refund_status: 'processed',
          refund_processed_at: new Date().toISOString(),
          payment_status: refundAmount && refundAmount < (registration.refund_amount || 0) ? 'paid' : 'pending', // Partial refund keeps as paid
        })
        .eq('id', registrationId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update registration after refund' },
          { status: 500 }
        )
      }

      // Create payment history entry
      await supabase.from('payment_history').insert({
        registration_id: registrationId,
        transaction_type: 'refund',
        amount: -refund.amount / 100, // Convert from cents
        status: 'completed',
        stripe_refund_id: refund.id,
        description: `Refund processed: ${reason || 'No reason provided'}`,
        metadata: { reason, stripe_refund_id: refund.id },
      })

      return NextResponse.json({
        success: true,
        message: 'Refund processed successfully',
        refund: {
          ...updated,
          stripeRefundId: refund.id,
          refundAmount: refund.amount / 100,
        },
      })
    } catch (stripeError: any) {
      return NextResponse.json(
        { error: `Stripe error: ${stripeError.message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/refunds
 * Get refund requests
 */
export async function GET(request: NextRequest) {
  // NOTE: Defined outside try so we can safely reference it in catch logs
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') // 'requested', 'approved', 'rejected', 'processed'
  const conferenceId = searchParams.get('conference_id')

  try {
    if (!conferenceId) {
      return NextResponse.json(
        { error: 'Conference ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    let query = supabase
      .from('registrations')
      .select('*')
      .eq('refund_requested', true)
      .eq('conference_id', conferenceId)

    if (status) {
      query = query.eq('refund_status', status)
    }

    const { data: refunds, error } = await query.order('refund_requested_at', {
      ascending: false,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch refunds' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      refunds: refunds || [],
      total: refunds?.length || 0,
    })
  } catch (error) {
    log.error('Get refunds error', error instanceof Error ? error : undefined, {
      conferenceId: conferenceId || 'unknown',
      action: 'get_refunds',
    })
    return NextResponse.json(
      { error: 'Failed to get refunds' },
      { status: 500 }
    )
  }
}

interface RefundStatusUpdateBody {
  registrationId: string
  status: 'approved' | 'rejected'
  reason?: string
}

/**
 * PATCH /api/admin/refunds
 * Update refund status (approve/reject)
 */
export async function PATCH(request: NextRequest) {
  // NOTE: Defined outside try so we can safely reference it in catch logs
  let body: RefundStatusUpdateBody | null = null
  try {
    body = await request.json()
    
    if (!body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }
    
    const { registrationId, status, reason } = body

    if (!registrationId || !status) {
      return NextResponse.json(
        { error: 'Registration ID and status are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    const { data: updated, error } = await supabase
      .from('registrations')
      .update({
        refund_status: status,
        refund_reason: reason || undefined,
      })
      .eq('id', registrationId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update refund status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Refund ${status} successfully`,
      refund: updated,
    })
  } catch (error) {
    log.error('Update refund error', error instanceof Error ? error : undefined, {
      registrationId: body?.registrationId || 'unknown',
      status: body?.status || 'unknown',
      action: 'update_refund',
    })
    return NextResponse.json(
      { error: 'Failed to update refund' },
      { status: 500 }
    )
  }
}

