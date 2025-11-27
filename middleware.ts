import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if trying to access admin area
  if (pathname.startsWith('/admin')) {
    // Check for session cookie
    const session = request.cookies.get('admin_session')

    if (!session) {
      // Not authenticated - redirect to login
      const loginUrl = new URL('/auth/admin-login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Allow the request to continue
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/admin/:path*',
  ],
}

