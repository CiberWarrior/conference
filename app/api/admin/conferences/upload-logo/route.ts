import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/conferences/upload-logo
 * Upload conference logo to Supabase Storage
 * Uses admin client to bypass RLS policies
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

    // Use admin client to bypass RLS policies
    const supabase = createAdminClient()

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

    // If bucket doesn't exist, try to create it
    if (uploadError) {
      const errorMessage = uploadError.message || ''
      
      // Check if bucket doesn't exist
      if (errorMessage.includes('not found') || errorMessage.includes('Bucket') || errorMessage.includes('does not exist')) {
        log.info('Bucket not found, creating conference-logos bucket', {
          conferenceId,
          action: 'create_bucket',
        })
        
        // Try to create the bucket
        const { data: bucket, error: createError } = await supabase.storage.createBucket('conference-logos', {
          public: true,
          fileSizeLimit: 2097152, // 2MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'],
        })
        
        if (createError) {
          log.error('Failed to create bucket', createError, {
            conferenceId,
            bucketName: 'conference-logos',
            action: 'create_bucket',
          })
          return NextResponse.json(
            { 
              error: 'Storage bucket not configured',
              details: 'The "conference-logos" bucket does not exist and could not be created automatically',
              hint: `Please go to Supabase Dashboard → SQL Editor and run:\n\nINSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)\nVALUES ('conference-logos', 'conference-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'])\nON CONFLICT (id) DO NOTHING;`
            },
            { status: 500 }
          )
        }
        
        log.info('Bucket created successfully, retrying upload', {
          conferenceId,
          bucketName: 'conference-logos',
          action: 'create_bucket',
        })
        
        // Retry upload after creating bucket
        uploadResult = await supabase.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true,
          })
        
        uploadData = uploadResult.data
        uploadError = uploadResult.error
        
        if (uploadError) {
          log.error('Upload failed after creating bucket', uploadError, {
            conferenceId,
            bucketName,
            filePath,
            action: 'upload_logo',
          })
          return NextResponse.json(
            { 
              error: 'Failed to upload file after creating bucket',
              details: uploadError.message || 'Unknown error',
              hint: 'Bucket was created but upload failed. Please check Supabase Storage permissions.'
            },
            { status: 500 }
          )
        }
      } else {
        // Other upload errors
        log.error('Storage upload error', uploadError, {
          conferenceId,
          bucketName,
          filePath,
          action: 'upload_logo',
        })
        return NextResponse.json(
          { 
            error: 'Failed to upload file',
            details: uploadError.message || 'Unknown error',
            hint: 'Please check Supabase Storage configuration and ensure the bucket has proper permissions'
          },
          { status: 500 }
        )
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Log for debugging
    log.info('Logo uploaded successfully', {
      conferenceId,
      bucket: bucketName,
      path: filePath,
      action: 'upload_logo',
    })

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      bucket: bucketName,
    })
  } catch (error) {
    log.error('Logo upload error', error, {
      action: 'upload_logo',
    })
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}

