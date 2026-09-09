import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError, ApiError } from '@/lib/api-error'
import {
  resolveManageToken,
  createRegistrationManageToken,
  buildManageUrl,
} from '@/lib/registration-manage-token'
import { extractRegistrationContact } from '@/lib/registration-contact'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/manage?token=
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const token = request.nextUrl.searchParams.get('token')
    if (!token) throw ApiError.validationError('token is required')

    const row = await resolveManageToken(token)
    if (!row?.registration) throw ApiError.notFound('Invalid or expired link')

    const supabase = createAdminClient()
    const { data: conference } = await supabase
      .from('conferences')
      .select('id, name, slug, start_date, end_date, location, settings')
      .eq('slug', slug)
      .single()

    if (!conference || conference.id !== row.registration.conference_id) {
      throw ApiError.notFound('Registration not found for this conference')
    }

    const contact = extractRegistrationContact(row.registration)

    return NextResponse.json({
      conference: {
        id: conference.id,
        name: conference.name,
        slug: conference.slug,
        start_date: conference.start_date,
        end_date: conference.end_date,
        location: conference.location,
      },
      registration: {
        id: row.registration.id,
        payment_status: row.registration.payment_status,
        status: row.registration.status,
        created_at: row.registration.created_at,
        custom_data: row.registration.custom_data,
        selected_addons: row.registration.selected_addons,
        contact,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/conferences/[slug]/manage?token=
 * body: { action: 'update_custom_data' | 'request_cancel', custom_data?, reason? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const token = request.nextUrl.searchParams.get('token')
    if (!token) throw ApiError.validationError('token is required')

    const row = await resolveManageToken(token)
    if (!row?.registration) throw ApiError.notFound('Invalid or expired link')

    const supabase = createAdminClient()
    const { data: conference } = await supabase
      .from('conferences')
      .select('id, slug')
      .eq('slug', slug)
      .single()

    if (!conference || conference.id !== row.registration.conference_id) {
      throw ApiError.notFound('Registration not found for this conference')
    }

    const body = await request.json()
    const action = body?.action

    if (action === 'update_custom_data') {
      const custom_data = {
        ...(row.registration.custom_data || {}),
        ...(body.custom_data || {}),
      }
      const { error } = await supabase
        .from('registrations')
        .update({ custom_data })
        .eq('id', row.registration.id)
      if (error) throw ApiError.internal('Failed to update')
      return NextResponse.json({ success: true })
    }

    if (action === 'request_cancel') {
      const note = String(body.reason || '').slice(0, 500)
      const custom_data = {
        ...(row.registration.custom_data || {}),
        cancel_requested_at: new Date().toISOString(),
        cancel_reason: note,
      }

      const { error } = await supabase
        .from('registrations')
        .update({ custom_data })
        .eq('id', row.registration.id)

      if (error) throw ApiError.internal('Failed to request cancellation')

      return NextResponse.json({ success: true, message: 'Cancellation requested' })
    }

    throw ApiError.validationError('Unknown action')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST without token — admin regenerate (optional helper unused publicly)
 * Kept for internal tooling: create token for existing registration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { registrationId, adminSecret } = body || {}
    // Only allow with service path via matching app secret to avoid open endpoint
    if (
      !process.env.CRON_SECRET ||
      adminSecret !== process.env.CRON_SECRET ||
      !registrationId
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await createRegistrationManageToken(registrationId)
    return NextResponse.json({
      manageUrl: buildManageUrl(slug, token),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
