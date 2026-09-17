import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError, ApiError } from '@/lib/api-error'
import { resolveAbstractManageToken } from '@/lib/abstract-manage-token'
import {
  getAbstractContent,
  getAbstractKeywords,
  getAbstractTitle,
  getAbstractType,
} from '@/lib/abstract-display'

export const dynamic = 'force-dynamic'

async function loadAbstractForToken(token: string, slug: string) {
  const row = await resolveAbstractManageToken(token)
  if (!row?.abstract) throw ApiError.notFound('Invalid or expired link')

  const supabase = createAdminClient()
  const { data: conference } = await supabase
    .from('conferences')
    .select('id, name, slug, start_date, end_date, location')
    .eq('slug', slug)
    .single()

  if (!conference || conference.id !== row.abstract.conference_id) {
    throw ApiError.notFound('Abstract not found for this conference')
  }

  return { abstract: row.abstract, conference, supabase }
}

/**
 * GET /api/conferences/[slug]/my-abstract?token=
 * Author-facing status view. Reviewer identities and scores are never exposed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const token = request.nextUrl.searchParams.get('token')
    if (!token) throw ApiError.validationError('token is required')

    const { abstract, conference } = await loadAbstractForToken(token, slug)

    return NextResponse.json({
      conference: {
        name: conference.name,
        slug: conference.slug,
        start_date: conference.start_date,
        end_date: conference.end_date,
        location: conference.location,
      },
      abstract: {
        id: abstract.id,
        title: getAbstractTitle(abstract),
        content: getAbstractContent(abstract),
        keywords: getAbstractKeywords(abstract),
        type: getAbstractType(abstract),
        file_name: abstract.file_name,
        file_size: abstract.file_size,
        status: abstract.status || 'pending',
        decision_notes: abstract.decision_notes || null,
        decided_at: abstract.decided_at || null,
        revision_requested_at: abstract.revision_requested_at || null,
        withdrawn_at: abstract.withdrawn_at || null,
        uploaded_at: abstract.uploaded_at,
        authors: Array.isArray(abstract.authors) ? abstract.authors : [],
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/conferences/[slug]/my-abstract?token=
 * body: { action: 'withdraw' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const token = request.nextUrl.searchParams.get('token')
    if (!token) throw ApiError.validationError('token is required')

    const { abstract, supabase } = await loadAbstractForToken(token, slug)
    const body = await request.json()

    if (body?.action !== 'withdraw') {
      throw ApiError.validationError('Unknown action')
    }

    if (abstract.status === 'withdrawn') {
      return NextResponse.json({ success: true, status: 'withdrawn' })
    }
    if (abstract.status === 'accepted' || abstract.status === 'rejected') {
      throw ApiError.validationError(
        'This abstract already has a final decision. Please contact the organizers.'
      )
    }

    const { error } = await supabase
      .from('abstracts')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
      })
      .eq('id', abstract.id)

    if (error) throw ApiError.internal('Failed to withdraw abstract')

    return NextResponse.json({ success: true, status: 'withdrawn' })
  } catch (error) {
    return handleApiError(error)
  }
}
