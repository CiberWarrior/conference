import { NextRequest, NextResponse } from 'next/server'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'
import jsPDF from 'jspdf'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/invoice-pdf?registrationId=uuid
 * Generate PDF invoice for a registration
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('registrationId')

    if (!registrationId) {
      throw ApiError.validationError('Registration ID is required')
    }

    // First get registration to check conference_id
    const tempSupabase = await (await import('@/lib/supabase')).createServerClient()
    const { data: registration, error: regError } = await tempSupabase
      .from('registrations')
      .select('conference_id')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      throw ApiError.notFound('Registration')
    }

    // ✅ Use centralized auth helper
    const { supabase } = await requireConferencePermission(
      registration.conference_id,
      'can_view_registrations'
    )

    // Get full registration details
    const { data: fullRegistration, error: fullRegError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (fullRegError || !fullRegistration) {
      throw ApiError.notFound('Registration')
    }

    // Get payment history for this registration
    const { data: paymentHistory } = await supabase
      .from('payment_history')
      .select('*')
      .eq('registration_id', registrationId)
      .eq('transaction_type', 'payment')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPos = margin

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' })
    yPos += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Invoice #: ${fullRegistration.invoice_id || fullRegistration.id.substring(0, 8)}`, pageWidth - margin, yPos, {
      align: 'right',
    })
    yPos += 5
    doc.text(`Date: ${new Date(fullRegistration.created_at).toLocaleDateString()}`, pageWidth - margin, yPos, {
      align: 'right',
    })
    yPos += 15

    // Bill To section
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', margin, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${fullRegistration.first_name} ${fullRegistration.last_name}`, margin, yPos)
    yPos += 5
    doc.text(fullRegistration.email, margin, yPos)
    yPos += 5
    if (fullRegistration.institution) {
      doc.text(fullRegistration.institution, margin, yPos)
      yPos += 5
    }
    if (fullRegistration.country) {
      doc.text(fullRegistration.country, margin, yPos)
      yPos += 5
    }
    yPos += 10

    // Line items
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Items:', margin, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Table header
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    doc.setFont('helvetica', 'bold')
    doc.text('Description', margin, yPos)
    doc.text('Amount', pageWidth - margin, yPos, { align: 'right' })
    yPos += 5
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    // Item row
    doc.setFont('helvetica', 'normal')
    const itemDescription = 'Conference Registration'
    const itemAmount = paymentHistory && paymentHistory.length > 0
      ? paymentHistory[0].amount
      : 0

    doc.text(itemDescription, margin, yPos)
    doc.text(`$${itemAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 10

    // Total
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total:', pageWidth - margin - 50, yPos)
    doc.text(`$${itemAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 10

    // Payment status
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Payment Status: ${fullRegistration.payment_status?.toUpperCase() || 'PENDING'}`, margin, yPos)
    yPos += 5

    if (fullRegistration.payment_status === 'paid' && paymentHistory && paymentHistory.length > 0) {
      const payment = paymentHistory[0]
      doc.text(`Paid on: ${new Date(payment.created_at).toLocaleDateString()}`, margin, yPos)
    }

    // Footer
    yPos = pageHeight - 30
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('Thank you for your registration!', pageWidth / 2, yPos, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${fullRegistration.id.substring(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    return handleApiError(error, { action: 'generate_invoice_pdf' })
  }
}

