import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/subscription-plans
 * Get all active subscription plans
 * Super Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify user is authenticated (any admin can view plans)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    log.error('Error fetching subscription plans', error)
    return NextResponse.json({ 
      error: 'Failed to fetch subscription plans' 
    }, { status: 500 })
  }
}

