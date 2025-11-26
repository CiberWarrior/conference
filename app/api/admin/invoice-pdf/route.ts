import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
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
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

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
    doc.text(`Invoice #: ${registration.invoice_id || registration.id.substring(0, 8)}`, pageWidth - margin, yPos, {
      align: 'right',
    })
    yPos += 5
    doc.text(`Date: ${new Date(registration.created_at).toLocaleDateString()}`, pageWidth - margin, yPos, {
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
    doc.text(`${registration.first_name} ${registration.last_name}`, margin, yPos)
    yPos += 5
    doc.text(registration.email, margin, yPos)
    yPos += 5
    if (registration.institution) {
      doc.text(registration.institution, margin, yPos)
      yPos += 5
    }
    if (registration.country) {
      doc.text(registration.country, margin, yPos)
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
    doc.text(`Payment Status: ${registration.payment_status.toUpperCase()}`, margin, yPos)
    yPos += 5

    if (registration.payment_status === 'paid' && paymentHistory && paymentHistory.length > 0) {
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
        'Content-Disposition': `attachment; filename="invoice-${registration.id.substring(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Invoice PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    )
  }
}

