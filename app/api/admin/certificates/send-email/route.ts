import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendCertificate } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/certificates/send-email
 * Send certificate via email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, certificateUrl, customMessage } = body

    if (!registrationId || !certificateUrl) {
      return NextResponse.json(
        { error: 'Registration ID and certificate URL are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get registration details
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Send certificate email
    await sendCertificate(
      registrationId,
      registration.email,
      registration.first_name,
      registration.last_name,
      certificateUrl,
      customMessage
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
    console.error('Send certificate email error:', error)
    return NextResponse.json(
      { error: 'Failed to send certificate email' },
      { status: 500 }
    )
  }
}

