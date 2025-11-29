import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/login
 * Server-side login that properly sets httpOnly cookies for session management
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('🔐 Login attempt for:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get cookies for reading and writing
    const cookieStore = await cookies()

    // Create a response that we'll use to set cookies
    const response = NextResponse.json({ success: false })

    // Create Supabase client with proper cookie handling for server-side
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Set cookie in both the request and response
            cookieStore.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    console.log('📡 Calling Supabase signInWithPassword...')

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('❌ Supabase auth error:', authError.message)
      return NextResponse.json(
        { error: authError.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!authData.user || !authData.session) {
      console.error('❌ No user or session returned')
      return NextResponse.json(
        { error: 'Login failed. Please try again.' },
        { status: 401 }
      )
    }

    console.log('✅ Supabase auth successful for:', authData.user.email)

    // Check if user has profile and is active
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError?.message)
      // Sign out the user since profile is missing
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'User profile not found. Please contact administrator.' },
        { status: 403 }
      )
    }

    if (!profile.active) {
      console.log('❌ User account is deactivated')
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Your account is deactivated. Please contact administrator.' },
        { status: 403 }
      )
    }

    console.log('✅ User profile found:', { role: profile.role, active: profile.active })

    // Update last login timestamp
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id)

    console.log('✅ Login successful, returning session data')

    // Return success response with session data for client-side sync
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: profile.role,
          full_name: profile.full_name,
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        },
      },
      { 
        status: 200,
        headers: response.headers, // Include the cookies we set
      }
    )
  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    )
  }
}

