import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      log.error('Logout error', error instanceof Error ? error : undefined, {
        action: 'admin_logout',
      })
      return NextResponse.json(
        { error: 'Failed to logout' },
        { status: 500 }
      )
    }

    log.info('Admin logout successful', {
      action: 'admin_logout',
    })

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error) {
    log.error('Logout error', error instanceof Error ? error : undefined, {
      action: 'admin_logout',
    })
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}

