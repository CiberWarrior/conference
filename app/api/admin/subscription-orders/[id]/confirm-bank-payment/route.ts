import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError } from '@/lib/api-error'
import { sendWelcomeEmail } from '@/lib/email'
import { log } from '@/lib/logger'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  verified: z.boolean(),
})

function generateSecurePassword(): string {
  const length = 16
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const values = crypto.getRandomValues(new Uint8Array(length))
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length]
  }
  return password
}

/**
 * PATCH /api/admin/subscription-orders/[id]/confirm-bank-payment
 * Super admin marks a bank-transfer subscription order as paid (or undoes it).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireSuperAdmin()
    const supabase = createAdminClient()
    const orderId = params.id

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { verified } = parsed.data

    const { data: order, error: orderError } = await supabase
      .from('subscription_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_method !== 'bank_transfer') {
      return NextResponse.json(
        { error: 'Only bank transfer orders can be confirmed here' },
        { status: 400 }
      )
    }

    if (!verified) {
      // Undo: mark pending again (do not delete user/subscription for safety)
      await supabase
        .from('subscription_orders')
        .update({
          status: 'pending',
          bank_transfer_verified: false,
          bank_transfer_verified_at: null,
          bank_transfer_verified_by: null,
        })
        .eq('id', orderId)

      return NextResponse.json({ ok: true, status: 'pending' })
    }

    if (order.status === 'paid') {
      return NextResponse.json({ ok: true, status: 'paid', alreadyPaid: true })
    }

    // Provision conference admin (same logic as Stripe webhook self-service)
    const email = order.email
    const fullName = order.full_name
    const organization = order.organization

    const { data: listed, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      log.error('Failed to list auth users for bank order', listError, { orderId })
      return NextResponse.json(
        { error: 'Failed to look up user account' },
        { status: 500 }
      )
    }

    const existing = listed?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
    )

    let userId: string
    let tempPassword: string | null = null

    if (existing) {
      userId = existing.id

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle()

      if (!existingProfile) {
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: userId,
          email,
          full_name: fullName,
          role: 'conference_admin',
          active: true,
          organization,
        })

        if (profileError) {
          log.error('Failed to create profile for existing auth user', profileError, {
            orderId,
            userId,
          })
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          )
        }
      }
    } else {
      tempPassword = generateSecurePassword()
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            organization,
            created_via: 'subscription_bank_transfer',
          },
        })

      if (createError || !newUser.user) {
        log.error('Failed to create user for bank order', createError, {
          orderId,
          email,
        })
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }

      userId = newUser.user.id

      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'conference_admin',
        active: true,
        organization,
      })

      if (profileError) {
        log.error('Failed to create user profile', profileError, { orderId, userId })
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      try {
        await sendWelcomeEmail(
          email,
          fullName,
          tempPassword,
          'Conference Platform'
        )
      } catch (emailError) {
        log.error('Welcome email failed', emailError, { orderId, email })
      }
    }

    const startsAt = new Date()
    const expiresAt = new Date()
    if (order.billing_cycle === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: order.plan_id,
        status: 'active',
        billing_cycle: order.billing_cycle,
        price: order.price,
        currency: order.currency,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (subError || !subscription) {
      log.error('Failed to create subscription for bank order', subError, {
        orderId,
      })
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    await supabase
      .from('subscription_orders')
      .update({
        status: 'paid',
        bank_transfer_verified: true,
        bank_transfer_verified_at: new Date().toISOString(),
        bank_transfer_verified_by: user.id,
        user_id: userId,
        subscription_id: subscription.id,
      })
      .eq('id', orderId)

    return NextResponse.json({
      ok: true,
      status: 'paid',
      subscriptionId: subscription.id,
      userId,
    })
  } catch (error) {
    return handleApiError(error, { action: 'confirm_subscription_bank_payment' })
  }
}
