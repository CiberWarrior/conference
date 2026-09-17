import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError, ApiError } from '@/lib/api-error'
import { resolveManageToken } from '@/lib/registration-manage-token'
import { buildProformaPdfForRegistration } from '@/lib/registration-proforma-data'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/proforma?token=
 * Download proforma invoice PDF for a bank-transfer registration (manage token).
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
      .select('id, name, slug, settings, pricing, owner_id')
      .eq('slug', slug)
      .single()

    if (!conference || conference.id !== row.registration.conference_id) {
      throw ApiError.notFound('Registration not found for this conference')
    }

    const localeParam = request.nextUrl.searchParams.get('locale')
    const locale = localeParam === 'hr' ? 'hr' : 'en'

    const pdf = await buildProformaPdfForRegistration(
      supabase,
      row.registration,
      conference,
      { locale }
    )

    if (!pdf) {
      throw ApiError.notFound('Proforma invoice is not available for this registration')
    }

    const ref =
      row.registration.registration_number ||
      row.registration.id.substring(0, 8).toUpperCase()

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proforma-${ref}.pdf"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
