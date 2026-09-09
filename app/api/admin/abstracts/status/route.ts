import { NextRequest, NextResponse } from 'next/server'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { sendAbstractDecisionEmail } from '@/lib/email'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ALLOWED = ['pending', 'under_review', 'accepted', 'rejected', 'withdrawn'] as const

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
    if (!ALLOWED.includes(status)) {
      throw ApiError.validationError(`Invalid status. Allowed: ${ALLOWED.join(', ')}`)
    }

    const { supabase } = await requireConferencePermission(
      conferenceId,
      'can_manage_abstracts'
    )

    const { data: abstract, error: fetchError } = await supabase
      .from('abstracts')
      .select('*, conferences(id, name, email_settings)')
      .eq('id', abstractId)
      .eq('conference_id', conferenceId)
      .single()

    if (fetchError || !abstract) {
      throw ApiError.notFound('Abstract not found')
    }

    const updates: Record<string, unknown> = {
      status,
      decision_notes: decisionNotes ?? abstract.decision_notes ?? null,
    }
    if (status === 'accepted' || status === 'rejected') {
      updates.decided_at = new Date().toISOString()
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

    if (
      notify &&
      abstract.email &&
      (status === 'accepted' || status === 'rejected')
    ) {
      try {
        const conference = abstract.conferences as {
          name?: string
          email_settings?: { from_email?: string; from_name?: string; reply_to?: string }
        } | null
        await sendAbstractDecisionEmail({
          email: abstract.email,
          conferenceName: conference?.name || 'Conference',
          status,
          fileName: abstract.file_name,
          notes: decisionNotes || undefined,
          emailSettings: conference?.email_settings,
        })
      } catch (emailError) {
        log.warn('Abstract decision email failed', emailError)
      }
    }

    return NextResponse.json({ success: true, abstract: updated })
  } catch (error) {
    return handleApiError(error)
  }
}
