import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

interface SubscriptionRow {
  id: string
  status: string
  billing_cycle: 'monthly' | 'yearly'
  price: number | null
  currency: string | null
  starts_at: string | null
  expires_at: string | null
  canceled_at: string | null
  created_at: string
  plan: { name: string | null; slug: string | null } | null
  user: {
    email: string | null
    full_name: string | null
    organization: string | null
  } | null
}

interface PaidOfferRow {
  custom_price: number | null
  discount_percent: number | null
  billing_cycle: 'monthly' | 'yearly'
  paid_at: string | null
  plan: { price_monthly: number | null; price_yearly: number | null } | null
}

const monthlyValue = (billingCycle: string, price: number) =>
  billingCycle === 'yearly' ? price / 12 : price

const round2 = (value: number) => Math.round(value * 100) / 100

/**
 * GET /api/admin/platform-revenue
 * Platform-level subscription revenue for the platform owner (Super Admin only).
 * Aggregates MRR, ARR, active subscriptions and paid offers across all organizers.
 */
export async function GET() {
  try {
    const { supabase } = await requireSuperAdmin()

    const { data: subsData, error: subsError } = await supabase
      .from('subscriptions')
      .select(
        `
        id,
        status,
        billing_cycle,
        price,
        currency,
        starts_at,
        expires_at,
        canceled_at,
        created_at,
        plan:subscription_plans ( name, slug ),
        user:user_profiles ( email, full_name, organization )
      `
      )
      .order('created_at', { ascending: false })

    if (subsError) {
      log.error('Failed to fetch subscriptions', subsError, {
        action: 'platform_revenue',
      })
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    const subscriptions = (subsData || []) as unknown as SubscriptionRow[]

    const now = Date.now()
    const isActive = (s: SubscriptionRow) =>
      s.status === 'active' &&
      (!s.expires_at || new Date(s.expires_at).getTime() > now)

    const activeSubs = subscriptions.filter(isActive)

    // Pick the dominant currency (seeded plans are EUR; avoid mixing totals)
    const currencyCounts = activeSubs.reduce<Record<string, number>>((acc, s) => {
      const cur = s.currency || 'EUR'
      acc[cur] = (acc[cur] || 0) + 1
      return acc
    }, {})
    const currency =
      Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'EUR'

    const mrr = round2(
      activeSubs.reduce(
        (sum, s) => sum + monthlyValue(s.billing_cycle, s.price || 0),
        0
      )
    )
    const arr = round2(mrr * 12)

    // Breakdown by plan (active subscriptions only)
    const byPlanMap = new Map<string, { plan: string; count: number; mrr: number }>()
    for (const s of activeSubs) {
      const key = s.plan?.slug || s.plan?.name || 'unknown'
      const label = s.plan?.name || 'Unknown'
      const existing = byPlanMap.get(key) || { plan: label, count: 0, mrr: 0 }
      existing.count += 1
      existing.mrr += monthlyValue(s.billing_cycle, s.price || 0)
      byPlanMap.set(key, existing)
    }
    const byPlan = Array.from(byPlanMap.values())
      .map((p) => ({ ...p, mrr: round2(p.mrr) }))
      .sort((a, b) => b.mrr - a.mrr)

    // Paid offers = actual money collected via one-off payment links
    const { data: offersData, error: offersError } = await supabase
      .from('payment_offers')
      .select(
        `
        custom_price,
        discount_percent,
        billing_cycle,
        paid_at,
        plan:subscription_plans ( price_monthly, price_yearly )
      `
      )
      .eq('status', 'paid')

    if (offersError) {
      log.error('Failed to fetch paid offers', offersError, {
        action: 'platform_revenue',
      })
    }

    const paidOffers = (offersData || []) as unknown as PaidOfferRow[]
    const paidOffersTotal = round2(
      paidOffers.reduce((sum, o) => {
        const base =
          o.custom_price ??
          (o.billing_cycle === 'yearly'
            ? o.plan?.price_yearly || 0
            : o.plan?.price_monthly || 0)
        const net = base * (1 - (o.discount_percent || 0) / 100)
        return sum + net
      }, 0)
    )

    return NextResponse.json({
      currency,
      mrr,
      arr,
      activeCount: activeSubs.length,
      totalCount: subscriptions.length,
      paidOffersCount: paidOffers.length,
      paidOffersTotal,
      byPlan,
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        status: s.status,
        billingCycle: s.billing_cycle,
        price: s.price || 0,
        currency: s.currency || 'EUR',
        planName: s.plan?.name || null,
        organization: s.user?.organization || null,
        fullName: s.user?.full_name || null,
        email: s.user?.email || null,
        startsAt: s.starts_at,
        expiresAt: s.expires_at,
      })),
      pendingOrders: await loadPendingOrders(supabase),
    })
  } catch (error) {
    return handleApiError(error, { action: 'platform_revenue' })
  }
}

async function loadPendingOrders(supabase: Awaited<ReturnType<typeof requireSuperAdmin>>['supabase']) {
  const { data, error } = await supabase
    .from('subscription_orders')
    .select(
      `
      id,
      billing_cycle,
      price,
      currency,
      full_name,
      email,
      organization,
      payment_method,
      status,
      payment_reference,
      created_at,
      plan:subscription_plans ( name, slug )
    `
    )
    .eq('status', 'pending')
    .eq('payment_method', 'bank_transfer')
    .order('created_at', { ascending: false })

  if (error) {
    // Table may not exist yet before migration 059
    log.error('Failed to fetch pending subscription orders', error, {
      action: 'platform_revenue',
    })
    return []
  }

  return (data || []).map((o: any) => ({
    id: o.id,
    planName: o.plan?.name || null,
    billingCycle: o.billing_cycle,
    price: o.price,
    currency: o.currency || 'EUR',
    fullName: o.full_name,
    email: o.email,
    organization: o.organization,
    paymentReference: o.payment_reference,
    createdAt: o.created_at,
  }))
}
