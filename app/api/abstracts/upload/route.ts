import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAbstractFilePath } from '@/lib/storage'
import { sendAbstractSubmissionConfirmation } from '@/lib/email'
import { z } from 'zod'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_EXTENSIONS = ['.doc', '.docx']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const email = formData.get('email') as string | null
    const registrationId = formData.get('registrationId') as string | null
    const conferenceId = formData.get('conferenceId') as string | null

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'))
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension)
    const isValidMimeType =
      ALLOWED_MIME_TYPES.includes(file.type) || !file.type

    if (!isValidExtension && !isValidMimeType) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only Word documents (.doc, .docx) are allowed.',
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate email if provided
    if (email) {
      const emailSchema = z.string().email()
      try {
        emailSchema.parse(email)
      } catch {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        )
      }
    }

    // Validate registrationId format if provided
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (registrationId && !uuidRegex.test(registrationId)) {
      return NextResponse.json(
        { error: 'Invalid registration ID format' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Verify conference exists if conferenceId is provided
    if (conferenceId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(conferenceId)) {
        return NextResponse.json(
          { error: 'Invalid conference ID format' },
          { status: 400 }
        )
      }

      const { data: conference, error: confError } = await supabase
        .from('conferences')
        .select('id, settings')
        .eq('id', conferenceId)
        .eq('published', true)
        .eq('active', true)
        .single()

      if (confError || !conference) {
        return NextResponse.json(
          { error: 'Conference not found or not available' },
          { status: 404 }
        )
      }

      // Check if abstract submission is enabled for this conference
      const settings = conference.settings || {}
      if (settings.abstract_submission_enabled === false) {
        return NextResponse.json(
          { error: 'Abstract submission is not enabled for this conference' },
          { status: 403 }
        )
      }
    }

    // If registrationId is provided, verify it exists and matches email
    let verifiedRegistrationId: string | null = null
    if (registrationId) {
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('id, email')
        .eq('id', registrationId)
        .single()

      if (regError || !registration) {
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        )
      }

      // Verify email matches if both are provided
      if (email && registration.email !== email) {
        return NextResponse.json(
          { error: 'Email does not match registration' },
          { status: 400 }
        )
      }

      verifiedRegistrationId = registration.id
    }

    // Use organized file path structure
    const filePath = getAbstractFilePath(
      file.name,
      verifiedRegistrationId || null,
      email || null
    )

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('abstracts')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/msword',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Save metadata to database
    const { data: abstract, error: dbError } = await supabase
      .from('abstracts')
      .insert({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        email: email || null,
        registration_id: verifiedRegistrationId || null,
        conference_id: conferenceId || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file if database insert fails
      await supabase.storage.from('abstracts').remove([filePath])
      return NextResponse.json(
        { error: 'Failed to save abstract metadata' },
        { status: 500 }
      )
    }

    // Get conference name if conferenceId is provided
    let conferenceName: string | undefined
    if (conferenceId) {
      const { data: conference } = await supabase
        .from('conferences')
        .select('name')
        .eq('id', conferenceId)
        .single()
      conferenceName = conference?.name
    }

    // Send confirmation email (async, don't wait)
    if (email || verifiedRegistrationId) {
      const recipientEmail = email || null
      if (recipientEmail) {
        sendAbstractSubmissionConfirmation(
          abstract.id,
          recipientEmail,
          file.name,
          conferenceName
        ).catch((err) => {
          console.error('Failed to send abstract confirmation email:', err)
        })
      } else if (verifiedRegistrationId) {
        // Get email from registration
        const { data: registration } = await supabase
          .from('registrations')
          .select('email')
          .eq('id', verifiedRegistrationId)
          .single()
        if (registration?.email) {
          sendAbstractSubmissionConfirmation(
            abstract.id,
            registration.email,
            file.name,
            conferenceName
          ).catch((err) => {
            console.error('Failed to send abstract confirmation email:', err)
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Abstract uploaded successfully!',
      abstractId: abstract.id,
    })
  } catch (error) {
    console.error('Abstract upload error:', error)
    return NextResponse.json(
      { error: 'An error occurred during upload' },
      { status: 500 }
    )
  }
}

