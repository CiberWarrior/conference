import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { handleApiError, ApiError } from '@/lib/api-error'
import { resolveAbstractManageToken } from '@/lib/abstract-manage-token'
import {
  getAbstractContent,
  getAbstractKeywords,
  getAbstractTitle,
  getAbstractType,
  getSubmissionMethod,
} from '@/lib/abstract-display'
import { validateAbstractTextFields } from '@/lib/abstract-submission-validation'
import { validateAbstractFile } from '@/lib/abstract-file'
import {
  AbstractFileError,
  ABSTRACTS_BUCKET,
  removeStorageObject,
  uploadAbstractDocument,
} from '@/lib/abstract-storage'
import {
  abstractRevisionUploadRateLimit,
  checkRateLimit,
  createRateLimitHeaders,
} from '@/lib/rate-limit'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function loadReviseContext(token: string, slug: string) {
  const row = await resolveAbstractManageToken(token)
  if (!row?.abstract) throw ApiError.notFound('Invalid or expired link')

  const supabase = createAdminClient()
  const { data: conference } = await supabase
    .from('conferences')
    .select('id, name, slug, email_settings')
    .eq('slug', slug)
    .single()

  if (!conference || conference.id !== row.abstract.conference_id) {
    throw ApiError.notFound('Abstract not found for this conference')
  }

  return { abstract: row.abstract, conference, supabase }
}

/**
 * GET /api/conferences/[slug]/revise-abstract?token=
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const token = request.nextUrl.searchParams.get('token')
    if (!token) throw ApiError.validationError('token is required')

    const { abstract, conference } = await loadReviseContext(token, slug)
    const status = abstract.status || 'pending'

    if (status === 'accepted' || status === 'rejected' || status === 'withdrawn') {
      throw ApiError.validationError(
        'This abstract already has a final decision. Please contact the organizers if you need help.'
      )
    }

    if (status !== 'revise') {
      throw ApiError.validationError(
        'No revision has been requested for this abstract yet.'
      )
    }

    return NextResponse.json({
      conference: { name: conference.name, slug: conference.slug },
      abstract: {
        id: abstract.id,
        title: getAbstractTitle(abstract),
        content: getAbstractContent(abstract),
        keywords: getAbstractKeywords(abstract),
        type: getAbstractType(abstract),
        submission_method: getSubmissionMethod(abstract),
        file_name: abstract.file_name || null,
        file_size: abstract.file_size || null,
        decision_notes: abstract.decision_notes || null,
        revision_requested_at: abstract.revision_requested_at || null,
        status,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/conferences/[slug]/revise-abstract?token=
 * Submit a corrected abstract. Resets status to pending for re-review.
 * - online_form abstracts: JSON body with corrected text (unchanged behaviour)
 * - document_upload abstracts: multipart body with a replacement DOCX/PDF
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const token = request.nextUrl.searchParams.get('token')
    if (!token) throw ApiError.validationError('token is required')

    const { abstract, conference, supabase } = await loadReviseContext(token, slug)

    if (abstract.status !== 'revise') {
      throw ApiError.validationError(
        abstract.status === 'pending' || abstract.status === 'under_review'
          ? 'Your revision has already been received and is awaiting review.'
          : 'A revision cannot be submitted for this abstract.'
      )
    }

    const existingCustom =
      abstract.custom_data && typeof abstract.custom_data === 'object'
        ? (abstract.custom_data as Record<string, unknown>)
        : {}

    const isDocument = getSubmissionMethod(abstract) === 'document_upload'

    if (isDocument) {
      const rateLimitResult = await checkRateLimit(
        abstractRevisionUploadRateLimit,
        `revise:${abstract.id}`
      )
      if (rateLimitResult && !rateLimitResult.success) {
        const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        log.warn('Rate limit exceeded for abstract revision upload', {
          abstractId: abstract.id,
          retryAfter,
          slug,
        })
        return NextResponse.json(
          { error: 'Too many submissions. Please try again later.', retryAfter },
          { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
        )
      }

      const formData = await request.formData()
      const abstractTitle = (formData.get('abstractTitle') as string | null)?.trim() || ''
      const abstractKeywords = (formData.get('abstractKeywords') as string | null)?.trim() || ''
      const abstractType = (formData.get('abstractType') as string | null)?.trim() || ''
      const fileEntry = formData.get('file')
      const documentFile = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null

      if (!abstractTitle) throw ApiError.validationError('Abstract title is required')
      if (!documentFile) {
        throw ApiError.validationError(
          'A replacement document is required',
          'Upload a .docx or .pdf file'
        )
      }
      const fileValidation = validateAbstractFile(documentFile)
      if (!fileValidation.ok) {
        throw ApiError.validationError(fileValidation.error, fileValidation.details)
      }

      // New timestamped object; the previous file is intentionally left in place.
      let stored
      try {
        stored = await uploadAbstractDocument({
          conferenceId: conference.id,
          abstractId: abstract.id,
          file: documentFile,
        })
      } catch (uploadError) {
        if (uploadError instanceof AbstractFileError) {
          throw ApiError.validationError(uploadError.message, uploadError.details)
        }
        throw ApiError.internal('Failed to store the replacement document')
      }

      const custom_data: Record<string, unknown> = {
        ...existingCustom,
        abstractTitle,
        submissionMethod: 'document_upload',
        ...(abstractType ? { abstractType } : {}),
      }
      if (abstractKeywords) custom_data.abstractKeywords = abstractKeywords
      else delete custom_data.abstractKeywords

      const { error: updateError } = await supabase
        .from('abstracts')
        .update({
          title: abstractTitle,
          custom_data,
          file_name: stored.file_name,
          file_path: stored.file_path,
          file_size: stored.file_size,
          status: 'pending',
          decision_notes: null,
          revision_requested_at: null,
        })
        .eq('id', abstract.id)
        .eq('conference_id', conference.id)

      if (updateError) {
        await removeStorageObject(ABSTRACTS_BUCKET, stored.file_path)
        throw ApiError.internal('Failed to save revised abstract')
      }

      log.info('Abstract document revision submitted', {
        abstractId: abstract.id,
        conferenceId: conference.id,
        action: 'revise_abstract',
      })

      await notifyTeam(conference, abstractTitle, abstract.email, true)
      return NextResponse.json({ success: true, message: 'Revision submitted successfully' })
    }

    const body = await request.json()
    const abstractTitle = body?.abstractTitle as string | undefined
    const abstractContent = body?.abstractContent as string | undefined
    const abstractKeywords = body?.abstractKeywords as string | undefined
    const abstractType = body?.abstractType as string | undefined

    const textValidation = validateAbstractTextFields({
      abstractTitle,
      abstractContent,
      abstractKeywords,
    })
    if (!textValidation.ok) {
      throw ApiError.validationError(textValidation.error, textValidation.details)
    }

    const custom_data = {
      ...existingCustom,
      abstractTitle: abstractTitle?.trim(),
      abstractContent: abstractContent?.trim(),
      abstractKeywords: abstractKeywords?.trim(),
      ...(abstractType ? { abstractType } : {}),
    }

    const { error: updateError } = await supabase
      .from('abstracts')
      .update({
        title: abstractTitle?.trim() || null,
        custom_data,
        status: 'pending',
        decision_notes: null,
        revision_requested_at: null,
      })
      .eq('id', abstract.id)

    if (updateError) throw ApiError.internal('Failed to save revised abstract')

    log.info('Abstract text revision submitted', {
      abstractId: abstract.id,
      conferenceId: conference.id,
      action: 'revise_abstract',
    })

    await notifyTeam(conference, abstractTitle, abstract.email, false)

    return NextResponse.json({
      success: true,
      message: 'Revision submitted successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}

async function notifyTeam(
  conference: { name: string; email_settings: unknown },
  abstractTitle: string | undefined,
  submitterEmail: string | null | undefined,
  isDocument: boolean
) {
  const replyTo = (conference.email_settings as { reply_to?: string } | null)?.reply_to
  if (!replyTo) return

  try {
    const { sendConferenceTeamNotification } = await import('@/lib/email')
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/abstracts`
    const via = isDocument ? 'as a replacement document' : 'through the online form'

    await sendConferenceTeamNotification({
      to: replyTo,
      subject: `Abstract revision received — ${conference.name}`,
      conferenceName: conference.name,
      html: `
        <p>A revised abstract has been submitted ${via} and is ready for review.</p>
        <p><strong>Title:</strong> ${abstractTitle}</p>
        <p><strong>Submitter:</strong> ${submitterEmail || 'N/A'}</p>
        <p><a href="${adminUrl}">Open abstracts in admin</a></p>
      `,
      text: `Abstract revision received for ${conference.name}\nTitle: ${abstractTitle}\nSubmitter: ${submitterEmail || 'N/A'}\nAdmin: ${adminUrl}`,
    })
  } catch (notifyError) {
    log.warn('Failed to notify team about abstract revision', notifyError)
  }
}
