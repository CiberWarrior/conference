import { NextRequest, NextResponse } from 'next/server'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { sendAbstractDecisionEmail } from '@/lib/email'
import { issueAbstractReviseUrl } from '@/lib/abstract-manage-token'
import { getAbstractTitle, ABSTRACT_STATUSES } from '@/lib/abstract-display'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const NOTIFIABLE = ['accepted', 'rejected', 'revise'] as const

/**
 * PATCH /api/admin/abstracts/status
 * Update abstract status and optionally email the submitter.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { abstractId, conferenceId, status, decisionNotes, notify = true } = body || {}

    if (!abstractId || !conferenceId || !status) {
      throw ApiError.validationError('abstractId, conferenceId, and status are required')
    }
    if (!ABSTRACT_STATUSES.includes(status)) {
      throw ApiError.validationError(
        `Invalid status. Allowed: ${ABSTRACT_STATUSES.join(', ')}`
      )
    }

    const { supabase } = await requireConferencePermission(
      conferenceId,
      'can_manage_abstracts'
    )

    const { data: abstract, error: fetchError } = await supabase
      .from('abstracts')
      .select('*, conferences(id, name, slug, email_settings)')
      .eq('id', abstractId)
      .eq('conference_id', conferenceId)
      .single()

    if (fetchError || !abstract) {
      throw ApiError.notFound('Abstract not found')
    }

    const updates: Record<string, unknown> = {
      status,
      decision_notes:
        decisionNotes !== undefined ? decisionNotes || null : (abstract.decision_notes ?? null),
    }
    if (status === 'accepted' || status === 'rejected') {
      updates.decided_at = new Date().toISOString()
    }
    if (status === 'revise') {
      updates.revision_requested_at = new Date().toISOString()
    }
    if (status === 'withdrawn') {
      updates.withdrawn_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('abstracts')
      .update(updates)
      .eq('id', abstractId)
      .select()
      .single()

    if (updateError) {
      throw ApiError.internal('Failed to update abstract status')
    }

    const shouldNotify =
      notify && Boolean(abstract.email) && NOTIFIABLE.includes(status)

    if (shouldNotify) {
      try {
        const conference = abstract.conferences as {
          name?: string
          slug?: string
          email_settings?: { from_email?: string; from_name?: string; reply_to?: string }
        } | null

        const reviseUrl =
          status === 'revise' && conference?.slug
            ? await issueAbstractReviseUrl(abstractId, conference.slug)
            : null

        await sendAbstractDecisionEmail({
          email: abstract.email,
          conferenceName: conference?.name || 'Conference',
          status,
          fileName: abstract.file_name,
          title: getAbstractTitle(abstract) || undefined,
          notes: (decisionNotes ?? abstract.decision_notes) || undefined,
          reviseUrl: reviseUrl || undefined,
          emailSettings: conference?.email_settings,
        })
      } catch (emailError) {
        log.warn('Abstract decision email failed', emailError)
      }
    }

    return NextResponse.json({ success: true, abstract: updated, notified: shouldNotify })
  } catch (error) {
    return handleApiError(error)
  }
}
