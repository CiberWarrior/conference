import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/participant/auth/logout
 * Logout participant
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user before logout
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    // Sign out
    const { error } = await supabase.auth.signOut()

    if (error) {
      log.error('Participant logout failed', error, {
        userId: user.id,
      })
      return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
    }

    log.info('Participant logged out', {
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    log.error('Participant logout error', error as Error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
