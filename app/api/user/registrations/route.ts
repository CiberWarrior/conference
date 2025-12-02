import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/registrations
 * Get all registrations for the currently logged in user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all registrations for this user's email
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select(`
        *,
        conferences (
          id,
          name,
          slug,
          start_date,
          end_date,
          location,
          venue,
          logo_url
        )
      `)
      .eq('email', user.email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching registrations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ registrations })
  } catch (error) {
    console.error('Get registrations error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

