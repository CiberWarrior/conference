import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import jsPDF from 'jspdf'

export const dynamic = 'force-dynamic'

interface CertificateData {
  registrationId: string
  certificateType?: 'participation' | 'presentation' | 'organizer' | 'volunteer'
  conferenceName?: string
  conferenceDate?: string
  conferenceLocation?: string
  logoUrl?: string
}

/**
 * POST /api/admin/certificates/generate
 * Generate certificate PDF for a registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      registrationId,
      conferenceId,
      certificateType = 'participation',
      conferenceName = 'International Conference',
      conferenceDate,
      conferenceLocation,
      logoUrl,
    }: CertificateData & { conferenceId?: string } = body

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
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

    // Get registration details and verify it belongs to the conference
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .eq('conference_id', conferenceId)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found or does not belong to this conference' },
        { status: 404 }
      )
    }

    // Generate certificate number
    const certificateNumber = `CERT-${registration.id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

    // Create PDF certificate
    const doc = new jsPDF('landscape', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const centerX = pageWidth / 2

    // Background color (light blue)
    doc.setFillColor(240, 248, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Border
    doc.setDrawColor(100, 149, 237)
    doc.setLineWidth(2)
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

    // Logo (if provided)
    let logoHeight = 0
    if (logoUrl) {
      try {
        // Fetch logo image and convert to base64
        const logoResponse = await fetch(logoUrl)
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer()
          const logoBase64 = Buffer.from(logoBuffer).toString('base64')
          const logoMimeType = logoResponse.headers.get('content-type') || 'image/png'
          
          // Add logo to PDF (max width 60mm, maintain aspect ratio)
          const logoWidth = 60
          logoHeight = 20 // Adjust based on aspect ratio if needed
          
          doc.addImage(
            `data:${logoMimeType};base64,${logoBase64}`,
            'PNG', // or detect from mimeType
            centerX - logoWidth / 2,
            20,
            logoWidth,
            logoHeight
          )
        }
      } catch (error) {
        console.error('Failed to add logo:', error)
        // Fallback: show placeholder
        logoHeight = 20
        doc.setFillColor(200, 200, 200)
        doc.rect(centerX - 30, 20, 60, logoHeight, 'F')
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('[LOGO]', centerX, 30, { align: 'center' })
      }
    }

    // Decorative elements (only if no logo)
    if (!logoUrl) {
      doc.setFillColor(100, 149, 237)
      doc.circle(centerX, 30, 15, 'F')
    }
    
    // Certificate title (adjust Y position if logo is present)
    const titleY = logoUrl ? 50 + logoHeight : 50
    doc.setTextColor(25, 25, 112)
    doc.setFontSize(32)
    doc.setFont('helvetica', 'bold')
    doc.text('CERTIFICATE', centerX, titleY, { align: 'center' })

    // Subtitle
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(70, 70, 70)
    doc.text('of Participation', centerX, titleY + 10, { align: 'center' })

    // Main text
    doc.setFontSize(12)
    doc.setTextColor(50, 50, 50)
    doc.text('This is to certify that', centerX, titleY + 30, { align: 'center' })

    // Name (large and bold)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(25, 25, 112)
    const fullName = `${registration.first_name} ${registration.last_name}`
    doc.text(fullName, centerX, titleY + 50, { align: 'center' })

    // Institution (if available)
    if (registration.institution) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(100, 100, 100)
      doc.text(registration.institution, centerX, titleY + 60, { align: 'center' })
    }

    // Conference details
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(70, 70, 70)
    let yPos = titleY + 80
    doc.text('has successfully participated in', centerX, yPos, { align: 'center' })
    yPos += 10

    // Conference name (prominent)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(25, 25, 112)
    doc.text(conferenceName, centerX, yPos, { align: 'center' })
    yPos += 12

    // Date and location (if provided)
    if (conferenceDate || conferenceLocation) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      
      if (conferenceDate) {
        doc.text(`Date: ${conferenceDate}`, centerX, yPos, { align: 'center' })
        yPos += 8
      }
      
      if (conferenceLocation) {
        doc.text(`Location: ${conferenceLocation}`, centerX, yPos, { align: 'center' })
        yPos += 8
      }
    }

    // Certificate type badge
    if (certificateType !== 'participation') {
      yPos += 5
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 149, 237)
      doc.text(`Type: ${certificateType.toUpperCase()}`, centerX, yPos, { align: 'center' })
      yPos += 10
    }

    // Certificate number (small, bottom)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(`Certificate No: ${certificateNumber}`, centerX, pageHeight - 30, { align: 'center' })
    doc.text(`Issued: ${new Date().toLocaleDateString()}`, centerX, pageHeight - 25, { align: 'center' })

    // Signature lines
    yPos = pageHeight - 60
    doc.setDrawColor(200, 200, 200)
    doc.line(centerX - 60, yPos, centerX - 20, yPos)
    doc.line(centerX + 20, yPos, centerX + 60, yPos)
    
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Organizer Signature', centerX - 40, yPos + 8, { align: 'center' })
    doc.text('Conference Director', centerX + 40, yPos + 8, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Save certificate to database
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        registration_id: registrationId,
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
      .select()
      .single()

    if (certError) {
      console.error('Failed to save certificate:', certError)
    }

    // Update registration
    await supabase
      .from('registrations')
      .update({
        certificate_generated: true,
        certificate_generated_at: new Date().toISOString(),
      })
      .eq('id', registrationId)

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificateNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}

