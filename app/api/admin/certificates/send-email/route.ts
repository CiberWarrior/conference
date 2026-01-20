import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendCertificate } from '@/lib/email'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/certificates/send-email
 * Send certificate via email
 */
export async function POST(request: NextRequest) {
  let body: any = null
  try {
    body = await request.json()
    const { registrationId, certificateUrl, customMessage } = body

    if (!registrationId || !certificateUrl) {
      return NextResponse.json(
        { error: 'Registration ID and certificate URL are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get registration details with conference email settings
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        conference:conferences (
          email_settings
        )
      `)
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Get email settings from conference (if available)
    const emailSettings = (registration as any).conference?.email_settings || undefined

    // Send certificate email
    await sendCertificate(
      registrationId,
      registration.email,
      registration.first_name,
      registration.last_name,
      certificateUrl,
      customMessage,
      emailSettings
    )

    // Update registration
    await supabase
      .from('registrations')
      .update({
        certificate_sent: true,
        certificate_sent_at: new Date().toISOString(),
      })
      .eq('id', registrationId)

    return NextResponse.json({
      success: true,
      message: 'Certificate email sent successfully',
    })
  } catch (error) {
    log.error('Send certificate email error', error instanceof Error ? error : undefined, {
      registrationId: body?.registrationId || 'unknown',
      action: 'certificate_email',
    })
    return NextResponse.json(
      { error: 'Failed to send certificate email' },
      { status: 500 }
    )
  }
}

