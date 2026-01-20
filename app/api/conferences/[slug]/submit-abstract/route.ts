import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/conferences/[slug]/submit-abstract
 * Upload abstract file to Supabase Storage and create database record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const email = formData.get('email') as string
    const registrationId = formData.get('registrationId') as string | null
    const customDataStr = formData.get('custom_data') as string | null
    let customData = {}
    if (customDataStr) {
      try {
        customData = JSON.parse(customDataStr)
      } catch (err) {
        log.warn('Failed to parse custom_data', { error: err })
      }
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate file type (Word documents and PDF)
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ]
    const allowedExtensions = ['.doc', '.docx', '.pdf']

    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'))
    const isValidType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension)

    if (!isValidType) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: 'Only Word documents (.doc, .docx) and PDF files are allowed',
        },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File size too large',
          details: `File size must be less than 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 }
      )
    }

    // Get conference by slug
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
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Check if abstract submission is enabled
    const settings = conference.settings as { abstract_submission_enabled?: boolean }
    if (settings?.abstract_submission_enabled === false) {
      return NextResponse.json(
        { error: 'Abstract submission is not enabled for this conference' },
        { status: 403 }
      )
    }

    // Generate file path: abstracts/{conferenceId}/{timestamp}_{sanitizedFileName}
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${conference.id}/${timestamp}_${sanitizedFileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to 'abstracts' bucket
    const bucketName = 'abstracts'
    const uploadResult = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/msword',
        upsert: false, // Don't overwrite existing files
      })

    if (uploadResult.error) {
      log.error('Storage upload error', uploadResult.error, {
        conferenceId: conference.id,
        bucketName,
        filePath,
        action: 'submit_abstract',
      })

      // Check if bucket doesn't exist
      const errorMessage = uploadResult.error.message || ''
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('Bucket') ||
        errorMessage.includes('does not exist')
      ) {
        return NextResponse.json(
          {
            error: 'Storage bucket not configured',
            details:
              'The "abstracts" bucket does not exist. Please contact the administrator.',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: 'Failed to upload file',
          details: uploadResult.error.message || 'Unknown error',
        },
        { status: 500 }
      )
    }

    // Create database record
    const { data: abstractRecord, error: dbError } = await supabase
      .from('abstracts')
      .insert({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        email: email,
        conference_id: conference.id,
        registration_id: registrationId || null,
        custom_data: customData,
      })
      .select()
      .single()

    if (dbError) {
      log.error('Failed to create abstract record', dbError, {
        conferenceId: conference.id,
        filePath,
        action: 'submit_abstract',
      })

      // Try to delete the uploaded file if database insert fails
      await supabase.storage.from(bucketName).remove([filePath])

      return NextResponse.json(
        {
          error: 'Failed to save abstract record',
          details: dbError.message || 'Unknown error',
        },
        { status: 500 }
      )
    }

    log.info('Abstract submitted successfully', {
      abstractId: abstractRecord.id,
      conferenceId: conference.id,
      email,
      filePath,
      action: 'submit_abstract',
    })

    // Send confirmation email to submitter (optional - if email service is configured)
    // TODO: Uncomment when ready to send confirmation emails
    // try {
    //   const { sendEmail } = await import('@/lib/email')
    //   await sendEmail({
    //     emailType: 'abstract_submission_confirmation',
    //     email,
    //     abstractId: abstractRecord.id,
    //     fileName: file.name,
    //     conferenceName: conference.name,
    //     emailSettings: conference.email_settings,
    //   })
    // } catch (emailError) {
    //   log.warn('Failed to send abstract confirmation email', emailError)
    // }

    // Send notification to conference team (if reply_to email is configured)
    if (conference.email_settings?.reply_to) {
      try {
        const { sendConferenceTeamNotification } = await import('@/lib/email')
        
        await sendConferenceTeamNotification({
          to: conference.email_settings.reply_to,
          subject: `📄 New Abstract Submission: ${conference.name}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .field { margin-bottom: 15px; }
                  .label { font-weight: bold; color: #4b5563; display: block; margin-bottom: 5px; }
                  .value { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
                  .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">📄 New Abstract Submission</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">A new abstract has been submitted</p>
                  </div>
                  <div class="content">
                    <div class="field">
                      <span class="label">Conference:</span>
                      <div class="value">${conference.name}</div>
                    </div>
                    <div class="field">
                      <span class="label">Abstract ID:</span>
                      <div class="value">${abstractRecord.id}</div>
                    </div>
                    <div class="field">
                      <span class="label">File Name:</span>
                      <div class="value">${file.name}</div>
                    </div>
                    <div class="field">
                      <span class="label">File Size:</span>
                      <div class="value">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <div class="field">
                      <span class="label">Submitted by:</span>
                      <div class="value">${email}</div>
                    </div>
                    ${registrationId ? `
                    <div class="field">
                      <span class="label">Registration ID:</span>
                      <div class="value">${registrationId}</div>
                    </div>
                    ` : ''}
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/abstracts" class="button">
                        View Abstract →
                      </a>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
          text: `
New Abstract Submission

Conference: ${conference.name}
Abstract ID: ${abstractRecord.id}
File Name: ${file.name}
File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB
Submitted by: ${email}
${registrationId ? `Registration ID: ${registrationId}` : ''}

View in admin panel: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/abstracts
          `,
          conferenceName: conference.name,
        })
        log.info('Conference team notification sent for abstract submission', {
          abstractId: abstractRecord.id,
          conferenceId: conference.id,
          notificationEmail: conference.email_settings.reply_to,
        })
      } catch (notificationError) {
        log.error('Failed to send conference team notification for abstract', notificationError instanceof Error ? notificationError : undefined, {
          abstractId: abstractRecord.id,
          conferenceId: conference.id,
          action: 'team_notification_abstract',
        })
        // Don't fail abstract submission if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      abstractId: abstractRecord.id,
      message: 'Abstract submitted successfully',
    })
  } catch (error) {
    log.error('Abstract submission error', error, {
      action: 'submit_abstract',
    })
    return NextResponse.json(
      { error: 'Failed to submit abstract' },
      { status: 500 }
    )
  }
}
