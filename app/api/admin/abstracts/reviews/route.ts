import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { sendGenericEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/abstracts/reviews?conferenceId=&abstractId=
 */
export async function GET(request: NextRequest) {
  try {
    const conferenceId = request.nextUrl.searchParams.get('conferenceId')
    const abstractId = request.nextUrl.searchParams.get('abstractId')
    if (!conferenceId) throw ApiError.validationError('conferenceId is required')

    const { supabase } = await requireConferencePermission(
      conferenceId,
      'can_manage_abstracts'
    )

    const { data: reviewers } = await supabase
      .from('abstract_reviewers')
      .select('*')
      .eq('conference_id', conferenceId)
      .order('created_at', { ascending: false })

    let reviews: unknown[] = []
    if (abstractId) {
      const { data, error } = await supabase
        .from('abstract_reviews')
        .select(
          '*, reviewer:abstract_reviewers(id, email, name), abstract:abstracts(id, file_name, email, status)'
        )
        .eq('abstract_id', abstractId)
      if (error) throw ApiError.internal('Failed to load reviews')
      reviews = data || []
    } else {
      const { data: abstracts } = await supabase
        .from('abstracts')
        .select('id')
        .eq('conference_id', conferenceId)
      const ids = (abstracts || []).map((a) => a.id)
      if (ids.length > 0) {
        const { data, error } = await supabase
          .from('abstract_reviews')
          .select(
            '*, reviewer:abstract_reviewers(id, email, name), abstract:abstracts(id, file_name, email, status)'
          )
          .in('abstract_id', ids)
        if (error) throw ApiError.internal('Failed to load reviews')
        reviews = data || []
      }
    }

    return NextResponse.json({ reviewers: reviewers || [], reviews })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/abstracts/reviews
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conferenceId, action } = body || {}
    if (!conferenceId || !action) {
      throw ApiError.validationError('conferenceId and action are required')
    }

    const { supabase } = await requireConferencePermission(
      conferenceId,
      'can_manage_abstracts'
    )

    if (action === 'invite_reviewer') {
      const email = String(body.email || '').trim().toLowerCase()
      const name = body.name ? String(body.name).trim() : null
      if (!email) throw ApiError.validationError('email is required')

      const inviteToken = randomBytes(24).toString('hex')

      const { data: existing } = await supabase
        .from('abstract_reviewers')
        .select('id')
        .eq('conference_id', conferenceId)
        .eq('email', email)
        .maybeSingle()

      let reviewer
      if (existing) {
        const { data, error } = await supabase
          .from('abstract_reviewers')
          .update({ name, invite_token: inviteToken })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw ApiError.internal('Failed to update reviewer')
        reviewer = data
      } else {
        const { data, error } = await supabase
          .from('abstract_reviewers')
          .insert({
            conference_id: conferenceId,
            email,
            name,
            invite_token: inviteToken,
          })
          .select()
          .single()
        if (error) throw ApiError.internal('Failed to create reviewer')
        reviewer = data
      }

      const { data: conference } = await supabase
        .from('conferences')
        .select('name, slug')
        .eq('id', conferenceId)
        .single()

      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const reviewUrl = `${base}/review/${inviteToken}`

      try {
        await sendGenericEmail({
          to: email,
          subject: `Review invitation — ${conference?.name || 'Conference'}`,
          html: `<p>You have been invited to review abstracts for <strong>${conference?.name || 'a conference'}</strong>.</p>
            <p><a href="${reviewUrl}">Open reviewer portal</a></p>`,
          text: `Review invitation: ${reviewUrl}`,
        })
      } catch {
        // Admin can still copy link
      }

      return NextResponse.json({ success: true, reviewer, reviewUrl })
    }

    if (action === 'assign') {
      const { abstractId, reviewerId } = body
      if (!abstractId || !reviewerId) {
        throw ApiError.validationError('abstractId and reviewerId are required')
      }

      const { data: abstract } = await supabase
        .from('abstracts')
        .select('id, status')
        .eq('id', abstractId)
        .eq('conference_id', conferenceId)
        .single()
      if (!abstract) throw ApiError.notFound('Abstract not found')

      const { data: existingReview } = await supabase
        .from('abstract_reviews')
        .select('id')
        .eq('abstract_id', abstractId)
        .eq('reviewer_id', reviewerId)
        .maybeSingle()

      let review
      if (existingReview) {
        review = existingReview
      } else {
        const { data, error } = await supabase
          .from('abstract_reviews')
          .insert({ abstract_id: abstractId, reviewer_id: reviewerId })
          .select()
          .single()
        if (error) throw ApiError.internal('Failed to assign review')
        review = data
      }

      if (abstract.status === 'pending') {
        await supabase
          .from('abstracts')
          .update({ status: 'under_review' })
          .eq('id', abstractId)
      }

      return NextResponse.json({ success: true, review })
    }

    throw ApiError.validationError('Unknown action')
  } catch (error) {
    return handleApiError(error)
  }
}
