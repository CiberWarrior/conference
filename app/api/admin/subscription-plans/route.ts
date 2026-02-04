import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/subscription-plans
 * Get all active subscription plans
 * Super Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ Use centralized auth helper
    const { user, supabase } = await requireAuth()

    // Get all active plans
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) {
      log.error('Failed to fetch subscription plans', error, {
        userId: user.id,
      })
      return NextResponse.json({ 
        error: 'Failed to fetch subscription plans' 
      }, { status: 500 })
    }

    return NextResponse.json({ plans })
  } catch (error) {
    return handleApiError(error, { action: 'get_subscription_plans' })
  }
}

