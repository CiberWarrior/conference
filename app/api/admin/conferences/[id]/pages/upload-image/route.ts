import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function assertCanEditConference(conferenceId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false as const, status: 401 as const, error: 'Unauthorized' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { ok: false as const, status: 403 as const, error: 'User profile not found' }
  }

  if (!profile.active) {
    return { ok: false as const, status: 403 as const, error: 'Your account is deactivated' }
  }

  if (profile.role !== 'super_admin') {
    const { data: permission } = await supabase
      .from('conference_permissions')
      .select('can_edit_conference')
      .eq('user_id', user.id)
      .eq('conference_id', conferenceId)
      .single()

    if (!permission?.can_edit_conference) {
      return {
        ok: false as const,
        status: 403 as const,
        error: 'Forbidden. You do not have permission to edit this conference.',
      }
    }
  }

  return { ok: true as const, userId: user.id }
}

/**
 * POST /api/admin/conferences/[id]/pages/upload-image
 * Upload image for conference pages
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await assertCanEditConference(params.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File size too large',
          details: `File size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Generate file path: page-images/{conferenceId}/{timestamp}_{filename}
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${params.id}/${timestamp}_${sanitizedFileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to 'page-images' bucket
    const bucketName = 'page-images'
    let uploadResult = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    // If bucket doesn't exist, try to create it
    if (uploadResult.error && uploadResult.error.message.includes('not found')) {
      log.warn('Page images bucket not found, attempting to create', {
        bucketName,
        conferenceId: params.id,
        action: 'upload_page_image',
      })

      // Note: Bucket creation should be done via migration, but we'll handle gracefully
      // For now, return error with instructions
      return NextResponse.json(
        {
          error: 'Storage bucket not configured',
          details: 'The page-images bucket does not exist. Please run the migration to create it.',
        },
        { status: 500 }
      )
    }

    if (uploadResult.error) {
      log.error('Storage upload error', uploadResult.error, {
        conferenceId: params.id,
        bucketName,
        filePath,
        action: 'upload_page_image',
      })
      return NextResponse.json(
        {
          error: 'Failed to upload file',
          details: uploadResult.error.message || 'Unknown error',
        },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    log.info('Page image uploaded successfully', {
      conferenceId: params.id,
      bucket: bucketName,
      path: filePath,
      action: 'upload_page_image',
    })

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (error) {
    log.error('Page image upload error', error, {
      conferenceId: params.id,
      action: 'upload_page_image',
    })
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
