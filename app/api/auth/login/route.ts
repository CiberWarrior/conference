import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { log } from '@/lib/logger'
import {
  loginRateLimit,
  getClientIP,
  checkRateLimit,
  createRateLimitHeaders,
} from '@/lib/rate-limit'

// Cookie options type for Supabase SSR
interface CookieOptions {
  path?: string
  maxAge?: number
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  domain?: string
}

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login
 * Server-side login that properly sets httpOnly cookies for session management
 * Rate limited: 5 attempts per 15 minutes per IP
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit(loginRateLimit, ip)

    if (rateLimitResult && !rateLimitResult.success) {
      const retryAfter = Math.ceil(
        (rateLimitResult.reset - Date.now()) / 1000
      )
      log.warn('Rate limit exceeded for login', {
        ip,
        retryAfter,
        action: 'login_rate_limit',
      })
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const body = await request.json()
    const { email, password } = body

    log.info('Login attempt', { email }) // Email will be masked automatically

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

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      log.error('Supabase environment variables not configured in login route')
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    // Create Supabase client with proper cookie handling for server-side
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          // @supabase/ssr@0.8.x expects getAll/setAll in route handlers
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Keep request cookieStore in sync and also set response cookies
              cookieStore.set({ name, value, ...options })
              response.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )

    log.debug('Calling Supabase signInWithPassword', { email })

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      log.warn('Login failed - authentication error', { 
        error: authError.message,
        email 
      })
      
      // Check if error is due to Supabase being unavailable/paused
      if (authError.message.includes('fetch') || authError.message.includes('network') || authError.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Unable to connect to authentication service. Please check if Supabase project is active.' },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: authError.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!authData.user || !authData.session) {
      log.error('Login failed - no user or session returned', { email })
      return NextResponse.json(
        { error: 'Login failed. Please try again.' },
        { status: 401 }
      )
    }

    log.info('Login successful', {
      userId: authData.user.id,
      email: authData.user.email, // Will be masked
    })

    // Check if user has profile and is active
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      log.error('Login failed - profile not found', profileError instanceof Error ? profileError : undefined, {
        userId: authData.user.id,
        email: authData.user.email,
      })
      // Sign out the user since profile is missing
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'User profile not found. Please contact administrator.' },
        { status: 403 }
      )
    }

    if (!profile.active) {
      log.warn('Login failed - account deactivated', {
        userId: authData.user.id,
        email: authData.user.email,
      })
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Your account is deactivated. Please contact administrator.' },
        { status: 403 }
      )
    }

    // ✅ SECURITY: Validate that user has admin role (super_admin or conference_admin)
    if (profile.role !== 'super_admin' && profile.role !== 'conference_admin') {
      log.warn('Login failed - user does not have admin role', {
        userId: authData.user.id,
        email: authData.user.email,
        role: profile.role,
      })
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Access denied. You do not have admin privileges.' },
        { status: 403 }
      )
    }

    log.debug('User profile found', {
      userId: authData.user.id,
      role: profile.role,
      active: profile.active,
    })

    // Update last login timestamp
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id)

    log.info('Login completed successfully', {
      userId: authData.user.id,
      role: profile.role,
    })

    // Return success response WITH the same response object that has session cookies set.
    // (Supabase setAll() wrote cookies to `response`; returning a new NextResponse.json()
    // would lose them and the browser would never receive the session.)
    const headers = new Headers(response.headers)
    if (rateLimitResult) {
      Object.entries(createRateLimitHeaders(rateLimitResult)).forEach(
        ([key, value]) => {
          headers.set(key, value)
        }
      )
    }

    const successResponse = NextResponse.json(
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
        headers,
      }
    )

    // Copy session cookies from the response Supabase wrote to, so the browser receives them
    response.cookies.getAll().forEach((cookie) => {
      successResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return successResponse
  } catch (error) {
    log.error('Login error', error, {
      action: 'login',
    })
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    )
  }
}

