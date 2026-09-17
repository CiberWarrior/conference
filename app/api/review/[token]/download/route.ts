import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError, ApiError } from '@/lib/api-error'
import { ABSTRACTS_BUCKET, createScopedSignedUrl } from '@/lib/abstract-storage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/review/[token]/download?reviewId=
 * Returns a short-lived signed URL for an abstract the reviewer is assigned to.
 *
 * Checks, in order: invite token → reviewer → review assignment belongs to that
 * reviewer → abstract belongs to the reviewer's conference → file exists.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const reviewId = request.nextUrl.searchParams.get('reviewId')
    if (!token || !reviewId) throw ApiError.validationError('reviewId is required')

    const supabase = createAdminClient()

    const { data: reviewer } = await supabase
      .from('abstract_reviewers')
      .select('id, conference_id')
      .eq('invite_token', token)
      .maybeSingle()

    if (!reviewer?.conference_id) throw ApiError.notFound('Invalid review link')

    const { data: review } = await supabase
      .from('abstract_reviews')
      .select('id, abstract:abstracts(id, conference_id, file_name, file_path)')
      .eq('id', reviewId)
      .eq('reviewer_id', reviewer.id)
      .maybeSingle()

    // abstract_reviews.abstract_id → abstracts is a to-one relation; the generated
    // type is untyped here so cast through unknown.
    const abstract = (review?.abstract ?? null) as unknown as {
      id: string
      conference_id: string | null
      file_name?: string | null
      file_path?: string | null
    } | null

    if (!abstract) throw ApiError.notFound('Review assignment not found')
    if (abstract.conference_id !== reviewer.conference_id) {
      throw ApiError.forbidden('Abstract does not belong to your conference')
    }
    if (!abstract.file_path) throw ApiError.notFound('Abstract file not found')

    const url = await createScopedSignedUrl({
      bucket: ABSTRACTS_BUCKET,
      filePath: abstract.file_path,
      conferenceId: reviewer.conference_id,
      downloadName: abstract.file_name || undefined,
    })

    return NextResponse.json({ url, fileName: abstract.file_name })
  } catch (error) {
    return handleApiError(error)
  }
}
