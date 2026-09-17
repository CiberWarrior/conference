import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAuthorAffiliations, isAbstractDeadlinePassed } from '@/lib/abstract-display'
import { validateAbstractTextFields } from '@/lib/abstract-submission-validation'
import { validateAbstractFile } from '@/lib/abstract-file'
import {
  AbstractFileError,
  ABSTRACTS_BUCKET,
  removeStorageObject,
  uploadAbstractDocument,
} from '@/lib/abstract-storage'
import {
  abstractDocumentSubmitRateLimit,
  abstractOnlineSubmitRateLimit,
  checkRateLimit,
  createRateLimitHeaders,
  getClientIP,
} from '@/lib/rate-limit'
import { log } from '@/lib/logger'
import type { AbstractSubmissionMethod, ConferenceSettings } from '@/types/conference'

export const dynamic = 'force-dynamic'

/**
 * POST /api/conferences/[slug]/submit-abstract
 *
 * Handles both submission methods configured per conference:
 * - online_form: structured text abstract (existing behaviour, file_* stays null)
 * - document_upload: metadata + one DOCX/PDF stored server-side in private Storage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const ip = getClientIP(request)

    const formData = await request.formData()
    const email = formData.get('email') as string
    const registrationId = formData.get('registrationId') as string | null
    const customDataStr = formData.get('custom_data') as string | null
    const authorsStr = formData.get('authors') as string | null

    const abstractTitle = formData.get('abstractTitle') as string | null
    const abstractContent = formData.get('abstractContent') as string | null
    const abstractKeywords = formData.get('abstractKeywords') as string | null
    const abstractType = formData.get('abstractType') as string | null
    const fileEntry = formData.get('file')
    const documentFile = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null

    let customData: Record<string, unknown> = {}
    if (customDataStr) {
      try {
        customData = JSON.parse(customDataStr)
      } catch (err) {
        log.warn('Failed to parse custom_data', { error: err })
      }
    }

    let authors: any[] = []
    if (authorsStr) {
      try {
        const parsed = JSON.parse(authorsStr)
        authors = (Array.isArray(parsed) ? parsed : []).map((author: any) => {
          const { affiliation: _legacy, ...rest } = author || {}
          return { ...rest, affiliations: getAuthorAffiliations(author) }
        })
      } catch (err) {
        log.warn('Failed to parse authors', { error: err })
      }
    }

    if (abstractTitle) customData = { ...customData, abstractTitle }
    if (abstractContent) customData = { ...customData, abstractContent }
    if (abstractKeywords) customData = { ...customData, abstractKeywords }
    if (abstractType) customData = { ...customData, abstractType }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: conference, error: conferenceError } = await supabase
      .from('conferences')
      .select('id, name, settings, email_settings')
      .eq('slug', params.slug)
      .eq('published', true)
      .eq('active', true)
      .single()

    if (conferenceError || !conference) {
      log.error('Conference not found for abstract submission', conferenceError, {
        slug: params.slug,
        action: 'submit_abstract',
      })
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    const settings = (conference.settings || {}) as Partial<ConferenceSettings>
    const submissionMethod: AbstractSubmissionMethod =
      settings.abstract_submission_method ?? 'online_form'
    const isDocumentMode = submissionMethod === 'document_upload'

    const rateLimitResult = await checkRateLimit(
      isDocumentMode ? abstractDocumentSubmitRateLimit : abstractOnlineSubmitRateLimit,
      `${ip}:${params.slug}`
    )
    if (rateLimitResult && !rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      log.warn('Rate limit exceeded for abstract submission', { ip, retryAfter, slug: params.slug })
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.', retryAfter },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    if (settings.abstract_submission_enabled === false) {
      return NextResponse.json(
        { error: 'Abstract submission is not enabled for this conference' },
        { status: 403 }
      )
    }

    if (isAbstractDeadlinePassed(settings.abstract_submission_deadline)) {
      return NextResponse.json(
        {
          error: 'Abstract submission deadline has passed',
          details: `Submissions closed on ${settings.abstract_submission_deadline}`,
        },
        { status: 403 }
      )
    }

    // --- Method-specific validation ---
    if (isDocumentMode) {
      if (!abstractTitle?.trim()) {
        return NextResponse.json({ error: 'Abstract title is required' }, { status: 400 })
      }
      if (!abstractType?.trim()) {
        return NextResponse.json({ error: 'Presentation type is required' }, { status: 400 })
      }
      if (!documentFile) {
        return NextResponse.json(
          { error: 'Abstract document is required', details: 'Upload a .docx or .pdf file' },
          { status: 400 }
        )
      }
      const fileValidation = validateAbstractFile(documentFile)
      if (!fileValidation.ok) {
        return NextResponse.json(
          { error: fileValidation.error, details: fileValidation.details },
          { status: 400 }
        )
      }
    } else {
      const textValidation = validateAbstractTextFields({
        abstractTitle,
        abstractContent,
        abstractKeywords,
      })
      if (!textValidation.ok) {
        return NextResponse.json(
          { error: textValidation.error, details: textValidation.details },
          { status: 400 }
        )
      }
    }

    if (authors.length === 0) {
      return NextResponse.json({ error: 'At least one author is required' }, { status: 400 })
    }

    for (let i = 0; i < authors.length; i++) {
      const author = authors[i]
      if (!author.firstName?.trim()) {
        return NextResponse.json(
          { error: `Author ${i + 1}: First name is required` },
          { status: 400 }
        )
      }
      if (!author.lastName?.trim()) {
        return NextResponse.json(
          { error: `Author ${i + 1}: Last name is required` },
          { status: 400 }
        )
      }
      if (!author.email?.trim()) {
        return NextResponse.json(
          { error: `Author ${i + 1}: Email is required` },
          { status: 400 }
        )
      }
      if (getAuthorAffiliations(author).length === 0) {
        return NextResponse.json(
          { error: `Author ${i + 1}: At least one institution is required` },
          { status: 400 }
        )
      }
    }

    if (!authors.some((a) => a.isCorresponding)) {
      return NextResponse.json(
        { error: 'Please select at least one corresponding author' },
        { status: 400 }
      )
    }

    // --- registrationId must belong to THIS conference and THIS submitter ---
    let verifiedRegistrationId: string | null = null
    if (registrationId) {
      const { data: registration } = await supabase
        .from('registrations')
        .select('id, email')
        .eq('id', registrationId)
        .eq('conference_id', conference.id)
        .maybeSingle()

      if (
        !registration ||
        (registration.email || '').trim().toLowerCase() !== email.trim().toLowerCase()
      ) {
        log.warn('Rejected abstract registrationId that does not match conference/email', {
          conferenceId: conference.id,
          registrationId,
        })
        return NextResponse.json(
          { error: 'Registration does not match this conference or email' },
          { status: 400 }
        )
      }
      verifiedRegistrationId = registration.id
    }

    customData = { ...customData, submissionMethod }

    const { data: abstractRecord, error: dbError } = await supabase
      .from('abstracts')
      .insert({
        file_name: null,
        file_path: null,
        file_size: null,
        email,
        conference_id: conference.id,
        registration_id: verifiedRegistrationId,
        title: abstractTitle?.trim() || null,
        custom_data: customData,
        authors,
      })
      .select()
      .single()

    if (dbError) {
      log.error('Failed to create abstract record', dbError, {
        conferenceId: conference.id,
        action: 'submit_abstract',
      })
      return NextResponse.json(
        {
          error: 'Failed to save abstract record',
          details: dbError.message || 'Unknown error',
        },
        { status: 500 }
      )
    }

    // --- Document mode: upload server-side, then attach to the row.
    // On any failure the just-created row is deleted so no half-finished
    // submission remains visible to organizers.
    let storedFileName: string | null = null
    let storedFileSize: number | null = null
    if (isDocumentMode && documentFile) {
      let storedPath: string | null = null
      try {
        const stored = await uploadAbstractDocument({
          conferenceId: conference.id,
          abstractId: abstractRecord.id,
          file: documentFile,
        })
        storedPath = stored.file_path

        const { error: updateError } = await supabase
          .from('abstracts')
          .update({
            file_name: stored.file_name,
            file_path: stored.file_path,
            file_size: stored.file_size,
          })
          .eq('id', abstractRecord.id)
          .eq('conference_id', conference.id)

        if (updateError) throw updateError

        storedFileName = stored.file_name
        storedFileSize = stored.file_size
      } catch (uploadError) {
        await supabase.from('abstracts').delete().eq('id', abstractRecord.id)
        if (storedPath) await removeStorageObject(ABSTRACTS_BUCKET, storedPath)

        log.error('Document abstract submission rolled back', uploadError, {
          abstractId: abstractRecord.id,
          conferenceId: conference.id,
          action: 'submit_abstract',
        })

        if (uploadError instanceof AbstractFileError) {
          return NextResponse.json(
            { error: uploadError.message, details: uploadError.details },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Failed to store abstract document. Please try again.' },
          { status: 500 }
        )
      }
    }

    log.info('Abstract submitted successfully', {
      abstractId: abstractRecord.id,
      conferenceId: conference.id,
      email,
      submissionMethod,
      action: 'submit_abstract',
    })

    try {
      const { sendAbstractSubmissionConfirmation } = await import('@/lib/email')
      const customMessage = abstractTitle
        ? `<strong>Title:</strong> ${abstractTitle}`
        : undefined

      await sendAbstractSubmissionConfirmation({
        email,
        abstractId: abstractRecord.id,
        conferenceName: conference.name,
        emailSettings: conference.email_settings,
        customMessage,
      })
    } catch (emailError) {
      log.warn('Failed to send abstract confirmation email', emailError)
    }

    if (conference.email_settings?.reply_to) {
      try {
        const { sendConferenceTeamNotification } = await import('@/lib/email')

        const authorsHtml =
          authors.length > 0
            ? authors
                .map(
                  (author: any, idx: number) => `
              <div style="padding: 10px; background: white; margin-bottom: 8px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <strong>${idx + 1}. ${author.firstName || ''} ${author.lastName || ''}</strong>
                ${author.isCorresponding ? '<span style="color: #3b82f6; font-size: 12px;"> (Corresponding)</span>' : ''}
                <br>
                <span style="font-size: 13px; color: #6b7280;">
                  ${author.email || ''}<br>
                  ${getAuthorAffiliations(author).join('<br>')}<br>
                  ${author.country ? `${author.country}${author.city ? `, ${author.city}` : ''}` : ''}
                </span>
              </div>
            `
                )
                .join('')
            : '<div class="value">No authors specified</div>'

        const contentPreview =
          abstractContent && abstractContent.length > 400
            ? `${abstractContent.slice(0, 400)}…`
            : abstractContent

        const documentLine =
          storedFileName
            ? `<p><strong>Document:</strong> ${storedFileName} (${((storedFileSize || 0) / 1024 / 1024).toFixed(2)} MB)</p>`
            : ''

        await sendConferenceTeamNotification({
          to: conference.email_settings.reply_to,
          subject: `New abstract submission: ${conference.name}`,
          html: `
            <p>A new abstract has been submitted${isDocumentMode ? ' as a document' : ' through the online form'}.</p>
            <p><strong>Conference:</strong> ${conference.name}</p>
            <p><strong>Abstract ID:</strong> ${abstractRecord.id}</p>
            ${abstractTitle ? `<p><strong>Title:</strong> ${abstractTitle}</p>` : ''}
            ${abstractType ? `<p><strong>Type:</strong> ${abstractType}</p>` : ''}
            ${abstractKeywords ? `<p><strong>Keywords:</strong> ${abstractKeywords}</p>` : ''}
            ${documentLine}
            ${contentPreview ? `<p><strong>Abstract preview:</strong><br>${contentPreview.replace(/\n/g, '<br>')}</p>` : ''}
            <p><strong>Authors:</strong></p>${authorsHtml}
            <p><strong>Submitted by:</strong> ${email}</p>
            ${verifiedRegistrationId ? `<p><strong>Registration ID:</strong> ${verifiedRegistrationId}</p>` : ''}
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/abstracts">Open abstracts in admin</a></p>
          `,
          text: `New abstract submission for ${conference.name}
ID: ${abstractRecord.id}
Title: ${abstractTitle || 'N/A'}
Type: ${abstractType || 'N/A'}
Keywords: ${abstractKeywords || 'N/A'}
${storedFileName ? `Document: ${storedFileName}\n` : ''}Submitted by: ${email}
Admin: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/abstracts`,
          conferenceName: conference.name,
        })
      } catch (notificationError) {
        log.error(
          'Failed to send conference team notification for abstract',
          notificationError instanceof Error ? notificationError : undefined,
          { abstractId: abstractRecord.id, conferenceId: conference.id }
        )
      }
    }

    return NextResponse.json({
      success: true,
      abstractId: abstractRecord.id,
      message: 'Abstract submitted successfully',
    })
  } catch (error) {
    log.error('Abstract submission error', error, { action: 'submit_abstract' })
    return NextResponse.json({ error: 'Failed to submit abstract' }, { status: 500 })
  }
}
