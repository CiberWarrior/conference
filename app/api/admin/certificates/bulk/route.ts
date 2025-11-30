import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/certificates/bulk
 * Generate certificates for multiple registrations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      registrationIds,
      conferenceId,
      certificateType = 'participation',
      conferenceName = 'International Conference',
      conferenceDate,
      conferenceLocation,
      sendEmail = false,
    } = body

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'Registration IDs array is required' },
        { status: 400 }
      )
    }

    if (!conferenceId) {
      return NextResponse.json(
        { error: 'Conference ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get registrations and verify they belong to the conference
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .in('id', registrationIds)
      .eq('conference_id', conferenceId)

    if (regError) {
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      )
    }

    const results = {
      generated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Generate certificates for each registration
    for (const registration of registrations || []) {
      try {
        // Skip if already generated
        if (registration.certificate_generated) {
          results.skipped++
          continue
        }

        // Generate certificate number
        const certificateNumber = `CERT-${registration.id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

        // Create certificate record
        const { error: certError } = await supabase.from('certificates').insert({
          registration_id: registration.id,
          certificate_type: certificateType,
          certificate_number: certificateNumber,
          issued_date: new Date().toISOString().split('T')[0],
          template_name: 'default',
          metadata: {
            conferenceName,
            conferenceDate,
            conferenceLocation,
          },
        })

        if (certError) {
          results.failed++
          results.errors.push(`Failed to create certificate for ${registration.email}: ${certError.message}`)
          continue
        }

        // Update registration
        await supabase
          .from('registrations')
          .update({
            certificate_generated: true,
            certificate_generated_at: new Date().toISOString(),
          })
          .eq('id', registration.id)

        results.generated++
      } catch (error) {
        results.failed++
        results.errors.push(
          `Error processing ${registration.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${results.generated} certificates, ${results.failed} failed, ${results.skipped} skipped`,
      ...results,
    })
  } catch (error) {
    console.error('Bulk certificate generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificates' },
      { status: 500 }
    )
  }
}

