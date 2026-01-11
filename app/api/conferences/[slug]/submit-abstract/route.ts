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
      .select('id, settings')
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
