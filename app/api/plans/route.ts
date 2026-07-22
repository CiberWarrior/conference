import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError } from '@/lib/api-error'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/plans
 * Public endpoint returning active subscription plans for the pricing page.
 * Only non-sensitive plan fields are exposed.
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select(
        'id, name, slug, description, price_monthly, price_yearly, currency, max_conferences, max_registrations_per_conference, max_storage_gb, features, display_order'
      )
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    // Do not expose IBAN publicly — only whether bank transfer is offered.
    // platform_settings may not exist until migration 058 is applied.
    let bankTransferAvailable = false
    try {
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('bank_transfer_enabled, bank_account_number')
        .eq('id', 1)
        .maybeSingle()

      bankTransferAvailable = !!(
        settings?.bank_transfer_enabled && settings?.bank_account_number
      )
    } catch {
      bankTransferAvailable = false
    }

    return NextResponse.json({
      plans: plans || [],
      bankTransferAvailable,
      cardAvailable: !!process.env.STRIPE_SECRET_KEY,
    })
  } catch (error) {
    return handleApiError(error, { action: 'get_public_plans' })
  }
}
