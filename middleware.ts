import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  console.log('🔒 Middleware checking:', {
    path: request.nextUrl.pathname,
    hasUser: !!user,
    userEmail: user?.email,
    error: userError?.message
  })

  // Check if trying to access admin area
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      console.log('❌ Middleware: No user found, redirecting to login')
      // Not authenticated - redirect to login
      const loginUrl = new URL('/auth/admin-login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    console.log('✅ Middleware: User authenticated, allowing access to', request.nextUrl.pathname)
  }

  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/admin/:path*',
  ],
}

