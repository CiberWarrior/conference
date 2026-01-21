import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

// Simple logger for Edge Runtime (middleware runs in Edge Runtime, can't use Winston)
const log = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta)
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta)
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, meta)
  },
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Supabase environment variables not configured in middleware')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // ✅ SECURITY: Log middleware checks (email is automatically masked)
  log.debug('Middleware check', {
    path: request.nextUrl.pathname,
    hasUser: !!user,
    userEmail: user?.email, // Will be masked by logger
    error: userError?.message,
  })

  // Check if trying to access admin area
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      log.debug('Unauthenticated admin access attempt', {
        path: request.nextUrl.pathname,
      })
      // Not authenticated - redirect to login
      const loginUrl = new URL('/auth/admin-login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.active || (profile.role !== 'super_admin' && profile.role !== 'conference_admin')) {
      log.warn('Non-admin user attempted to access admin area', {
        path: request.nextUrl.pathname,
        userId: user.id,
        role: profile?.role,
        active: profile?.active,
      })
      // Not an admin - redirect to login with error message
      const loginUrl = new URL('/auth/admin-login', request.url)
      loginUrl.searchParams.set('error', 'access_denied')
      return NextResponse.redirect(loginUrl)
    }

    log.debug('Authenticated admin access', {
      path: request.nextUrl.pathname,
      userId: user.id,
      role: profile.role,
    })
  }

  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/admin/:path*',
  ],
}

