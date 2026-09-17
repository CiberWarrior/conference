import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError, ApiError } from '@/lib/api-error'
import {
  getAbstractContent,
  getAbstractKeywords,
  getAbstractTitle,
  getAbstractType,
  getAuthorAffiliations,
  getSubmissionMethod,
} from '@/lib/abstract-display'

export const dynamic = 'force-dynamic'

/** Custom abstract fields may contain contact details; hide them for blind review. */
function sanitizeCustomData(customData: unknown): Record<string, unknown> {
  if (!customData || typeof customData !== 'object') return {}
  const reserved = new Set([
    'abstractTitle',
    'abstractContent',
    'abstractKeywords',
    'abstractType',
    'submissionMethod',
  ])
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(customData as Record<string, unknown>)) {
    if (reserved.has(key)) continue
    if (/e-?mail|phone|telefon|contact/i.test(key)) continue
    if (typeof value === 'string' && value.includes('@')) continue
    result[key] = value
  }
  return result
}

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
        'id, abstract_id, score, comments, recommendation, submitted_at, abstract:abstracts(id, file_name, file_path, file_size, title, status, custom_data, authors)'
      )
      .eq('reviewer_id', reviewer.id)
      .order('created_at', { ascending: true })

    // Blind: strip author emails and contact-like custom fields
    const sanitized = (reviews || []).map((r: any) => {
      const abs = r.abstract
      if (!abs) return r
      const authors = Array.isArray(abs.authors)
        ? abs.authors.map((a: any) => ({
            firstName: a.firstName,
            lastName: a.lastName,
            affiliations: getAuthorAffiliations(a),
            country: a.country,
            // email omitted for blind review
          }))
        : []
      return {
        ...r,
        abstract: {
          id: abs.id,
          file_name: abs.file_name,
          file_size: abs.file_size,
          title: getAbstractTitle(abs),
          status: abs.status,
          submission_method: getSubmissionMethod(abs),
          content: getAbstractContent(abs),
          keywords: getAbstractKeywords(abs),
          type: getAbstractType(abs),
          custom_data: sanitizeCustomData(abs.custom_data),
          authors,
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
