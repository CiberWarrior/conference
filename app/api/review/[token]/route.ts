import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError, ApiError } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

/**
 * GET /api/review/[token] — list assigned abstracts for this reviewer (blind: no author email)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    const { data: reviewer, error } = await supabase
      .from('abstract_reviewers')
      .select('id, name, email, conference_id, conferences(name, slug)')
      .eq('invite_token', token)
      .single()

    if (error || !reviewer) throw ApiError.notFound('Invalid review link')

    const { data: reviews } = await supabase
      .from('abstract_reviews')
      .select(
        'id, score, comments, recommendation, submitted_at, abstract:abstracts(id, file_name, file_path, title, status, custom_data, authors)'
      )
      .eq('reviewer_id', reviewer.id)

    // Blind: strip author emails from authors payload
    const sanitized = (reviews || []).map((r: any) => {
      const abs = r.abstract
      if (!abs) return r
      const authors = Array.isArray(abs.authors)
        ? abs.authors.map((a: any) => ({
            firstName: a.firstName,
            lastName: a.lastName,
            affiliation: a.affiliation,
            country: a.country,
            // email omitted for blind review
          }))
        : abs.authors
      return {
        ...r,
        abstract: {
          id: abs.id,
          file_name: abs.file_name,
          title: abs.title,
          status: abs.status,
          custom_data: abs.custom_data,
          authors,
          // signed URL generated on demand via separate download if needed
        },
      }
    })

    return NextResponse.json({
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        conference: reviewer.conferences,
      },
      reviews: sanitized,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/review/[token] — submit a review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { reviewId, score, comments, recommendation } = body || {}

    if (!reviewId) throw ApiError.validationError('reviewId is required')
    if (score != null && (score < 1 || score > 5)) {
      throw ApiError.validationError('score must be 1–5')
    }
    if (
      recommendation &&
      !['accept', 'reject', 'revise'].includes(recommendation)
    ) {
      throw ApiError.validationError('Invalid recommendation')
    }

    const supabase = createAdminClient()
    const { data: reviewer } = await supabase
      .from('abstract_reviewers')
      .select('id')
      .eq('invite_token', token)
      .single()

    if (!reviewer) throw ApiError.notFound('Invalid review link')

    const { data: updated, error } = await supabase
      .from('abstract_reviews')
      .update({
        score: score ?? null,
        comments: comments ?? null,
        recommendation: recommendation ?? null,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('reviewer_id', reviewer.id)
      .select()
      .single()

    if (error) throw ApiError.internal('Failed to save review')

    return NextResponse.json({ success: true, review: updated })
  } catch (error) {
    return handleApiError(error)
  }
}
