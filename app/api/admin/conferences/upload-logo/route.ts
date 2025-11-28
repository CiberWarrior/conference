import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/conferences/upload-logo
 * Upload conference logo to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const conferenceId = formData.get('conferenceId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!conferenceId) {
      return NextResponse.json(
        { error: 'Conference ID is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Generate file path: conference-logos/{conferenceId}/{timestamp}_{filename}
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    let filePath = `${conferenceId}/${timestamp}_${sanitizedFileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Try to upload to 'conference-logos' bucket first
    let bucketName = 'conference-logos'
    let uploadResult = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Allow overwriting existing files
      })

    let uploadData = uploadResult.data
    let uploadError = uploadResult.error

    // If bucket doesn't exist, provide helpful error message
    if (uploadError) {
      const errorMessage = uploadError.message || ''
      if (errorMessage.includes('not found') || errorMessage.includes('Bucket')) {
        return NextResponse.json(
          { 
            error: 'Storage bucket not found',
            details: 'The "conference-logos" bucket does not exist in Supabase Storage',
            hint: 'Please run the migration SQL file: supabase/migrations/011_create_conference_logos_bucket.sql in your Supabase SQL Editor to create the bucket'
          },
          { status: 500 }
        )
      }
    }

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { 
          error: 'Failed to upload file',
          details: uploadError.message || 'Unknown error',
          hint: 'Please create a "conference-logos" bucket in Supabase Storage (public bucket)'
        },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Log for debugging
    console.log('Logo uploaded successfully:', {
      bucket: bucketName,
      path: filePath,
      publicUrl: urlData.publicUrl,
    })

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      bucket: bucketName,
    })
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}

