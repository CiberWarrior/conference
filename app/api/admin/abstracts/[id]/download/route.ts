import { NextRequest, NextResponse } from 'next/server'
import { requireActiveAuth, requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { createAdminClient } from '@/lib/supabase-admin'
import { ABSTRACTS_BUCKET, createScopedSignedUrl } from '@/lib/abstract-storage'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/abstracts/[id]/download
 * Returns a short-lived signed URL for the abstract document.
 * Authorization: authenticated admin with can_manage_abstracts on the abstract's conference.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Reject anonymous callers before touching any abstract data.
    await requireActiveAuth()

    const admin = createAdminClient()
    const { data: abstract, error } = await admin
      .from('abstracts')
      .select('id, conference_id, file_path, file_name')
      .eq('id', params.id)
      .maybeSingle()

    if (error || !abstract || !abstract.conference_id) {
      throw ApiError.notFound('Abstract not found')
    }

    await requireConferencePermission(abstract.conference_id, 'can_manage_abstracts')

    if (!abstract.file_path) {
      throw ApiError.notFound('Document', 'This abstract has no document attached')
    }

    const url = await createScopedSignedUrl({
      bucket: ABSTRACTS_BUCKET,
      filePath: abstract.file_path,
      conferenceId: abstract.conference_id,
      downloadName: abstract.file_name || undefined,
    })

    log.info('Admin abstract document download issued', {
      abstractId: abstract.id,
      conferenceId: abstract.conference_id,
    })

    return NextResponse.json({ url, fileName: abstract.file_name })
  } catch (error) {
    return handleApiError(error)
  }
}
