import { NextRequest, NextResponse } from 'next/server'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { extractRegistrationContact, registrationDisplayName } from '@/lib/registration-contact'
import jsPDF from 'jspdf'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/badges/generate
 * Portrait name badge with registration UUID (scannable as text / QR via external image).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, conferenceId } = body || {}
    if (!registrationId || !conferenceId) {
      throw ApiError.validationError('registrationId and conferenceId are required')
    }

    const { supabase } = await requireConferencePermission(conferenceId, 'can_check_in')

    const { data: registration, error } = await supabase
      .from('registrations')
      .select('*, conferences(name, start_date, location, logo_url)')
      .eq('id', registrationId)
      .eq('conference_id', conferenceId)
      .single()

    if (error || !registration) throw ApiError.notFound('Registration not found')

    const name = registrationDisplayName(registration)
    const contact = extractRegistrationContact(registration)
    const conference = registration.conferences as {
      name?: string
      start_date?: string
      location?: string
      logo_url?: string
    } | null

    // Badge size ~ 100mm x 70mm in points (1mm ≈ 2.834)
    const w = 283.5
    const h = 198.4
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [w, h] })

    doc.setFillColor(30, 60, 114)
    doc.rect(0, 0, w, 36, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(conference?.name || 'Conference', w / 2, 22, { align: 'center' })

    doc.setTextColor(17, 24, 39)
    doc.setFontSize(22)
    doc.text(name, w / 2, 80, { align: 'center', maxWidth: w - 40 })

    if (contact.email) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      doc.text(contact.email, w / 2, 100, { align: 'center' })
    }

    // QR via QuickChart (no new npm dependency)
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(registrationId)}&size=120&margin=1`
    try {
      const qrRes = await fetch(qrUrl)
      if (qrRes.ok) {
        const buf = Buffer.from(await qrRes.arrayBuffer())
        const b64 = buf.toString('base64')
        doc.addImage(`data:image/png;base64,${b64}`, 'PNG', w / 2 - 40, 112, 80, 80)
      }
    } catch {
      doc.setFontSize(8)
      doc.text(registrationId, w / 2, 150, { align: 'center', maxWidth: w - 30 })
    }

    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.text(registrationId, w / 2, h - 10, { align: 'center' })

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="badge-${registrationId.slice(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
