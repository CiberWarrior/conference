import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createScopedSignedUrl, TEMPLATES_BUCKET } from '@/lib/abstract-storage'
import { checkRateLimit, createRateLimitHeaders, getClientIP, publicApiRateLimit } from '@/lib/rate-limit'
import { log } from '@/lib/logger'
import type { ConferenceSettings } from '@/types/conference'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conferences/[slug]/abstract-template
 * Public download of the organizer's abstract template (document_upload conferences only).
 * Redirects to a short-lived signed URL; the raw Storage path is never exposed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const rateLimitResult = await checkRateLimit(publicApiRateLimit, getClientIP(request))
    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    const supabase = createAdminClient()
    const { data: conference } = await supabase
      .from('conferences')
      .select('id, settings')
      .eq('slug', params.slug)
      .eq('published', true)
      .eq('active', true)
      .maybeSingle()

    if (!conference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    const settings = (conference.settings || {}) as Partial<ConferenceSettings>
    const template = settings.abstract_template
    if (
      (settings.abstract_submission_method ?? 'online_form') !== 'document_upload' ||
      !template?.file_path
    ) {
      return NextResponse.json({ error: 'No abstract template available' }, { status: 404 })
    }

    const signedUrl = await createScopedSignedUrl({
      bucket: TEMPLATES_BUCKET,
      filePath: template.file_path,
      conferenceId: conference.id,
      downloadName: template.file_name,
    })

    return NextResponse.redirect(signedUrl, { status: 302 })
  } catch (error) {
    log.error('Abstract template download error', error, { slug: params.slug })
    return NextResponse.json({ error: 'Failed to download template' }, { status: 500 })
  }
}
