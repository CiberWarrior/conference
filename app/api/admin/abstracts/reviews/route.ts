import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { sendGenericEmail, sendReviewerReminderEmail } from '@/lib/email'
import { log } from '@/lib/logger'

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
          '*, reviewer:abstract_reviewers(id, email, name), abstract:abstracts(id, file_name, title, email, status)'
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
            '*, reviewer:abstract_reviewers(id, email, name), abstract:abstracts(id, file_name, title, email, status)'
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

    if (action === 'unassign') {
      const { reviewId } = body
      if (!reviewId) throw ApiError.validationError('reviewId is required')

      const { data: review } = await supabase
        .from('abstract_reviews')
        .select('id, abstract_id, abstract:abstracts(conference_id)')
        .eq('id', reviewId)
        .maybeSingle()

      const owner = review?.abstract as { conference_id?: string } | null
      if (!review || owner?.conference_id !== conferenceId) {
        throw ApiError.notFound('Review not found')
      }

      const { error } = await supabase.from('abstract_reviews').delete().eq('id', reviewId)
      if (error) throw ApiError.internal('Failed to remove reviewer')

      const { count } = await supabase
        .from('abstract_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('abstract_id', review.abstract_id)

      if (!count) {
        await supabase
          .from('abstracts')
          .update({ status: 'pending' })
          .eq('id', review.abstract_id)
          .eq('status', 'under_review')
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'remind') {
      const reviewerId = body.reviewerId ? String(body.reviewerId) : null

      const { data: conference } = await supabase
        .from('conferences')
        .select('name')
        .eq('id', conferenceId)
        .single()

      let reviewerQuery = supabase
        .from('abstract_reviewers')
        .select('id, email, name, invite_token')
        .eq('conference_id', conferenceId)
      if (reviewerId) reviewerQuery = reviewerQuery.eq('id', reviewerId)

      const { data: reviewers } = await reviewerQuery
      if (!reviewers?.length) throw ApiError.notFound('No reviewers found')

      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      let reminded = 0
      const reviewIdsToStamp: string[] = []

      for (const reviewer of reviewers) {
        const { data: pending } = await supabase
          .from('abstract_reviews')
          .select('id')
          .eq('reviewer_id', reviewer.id)
          .is('submitted_at', null)

        if (!pending?.length) continue

        try {
          await sendReviewerReminderEmail({
            email: reviewer.email,
            reviewerName: reviewer.name,
            conferenceName: conference?.name || 'Conference',
            pendingCount: pending.length,
            reviewUrl: `${base}/review/${reviewer.invite_token}`,
          })
          reminded += 1
          reviewIdsToStamp.push(...pending.map((p) => p.id))
        } catch (emailError) {
          log.warn('Reviewer reminder email failed', emailError)
        }
      }

      if (reviewIdsToStamp.length > 0) {
        await supabase
          .from('abstract_reviews')
          .update({ reminded_at: new Date().toISOString() })
          .in('id', reviewIdsToStamp)
      }

      return NextResponse.json({ success: true, reminded })
    }

    throw ApiError.validationError('Unknown action')
  } catch (error) {
    return handleApiError(error)
  }
}
