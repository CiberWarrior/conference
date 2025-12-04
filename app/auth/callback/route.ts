import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /auth/callback
 * DISABLED: User login (magic link) has been removed
 * Users don't need dashboard access - all information is sent via email
 * Only admin users (Super Admin and Conference Admin) can access the system
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  // User login (magic link) has been removed
  // Users don't need dashboard access - all information is sent via email
  // Redirect to homepage
  return NextResponse.redirect(new URL('/?message=login_disabled', request.url))
}

