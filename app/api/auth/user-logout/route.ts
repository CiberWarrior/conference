import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { logUserActivity, getIpAddress, getUserAgent } from '@/lib/user-activity'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/user-logout
 * Logout user and log the activity
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Log the logout activity before signing out
    try {
      await logUserActivity('logout', {
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      })
    } catch (error) {
      // Don't fail logout if logging fails
      console.error('Failed to log logout activity:', error)
    }

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to logout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}

