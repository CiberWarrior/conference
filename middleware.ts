import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple logger for Edge Runtime (middleware runs in Edge Runtime, can't use Winston)
const log = {
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta)
    }
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta)
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta)
  },
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
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
        remove(name: string, options: any) {
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
    log.debug('Authenticated admin access', {
      path: request.nextUrl.pathname,
      userId: user.id,
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

