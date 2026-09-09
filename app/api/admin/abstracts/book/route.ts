import { NextRequest, NextResponse } from 'next/server'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import jsPDF from 'jspdf'

export const dynamic = 'force-dynamic'

function formatAuthors(authors: unknown): string {
  if (!Array.isArray(authors) || authors.length === 0) return ''
  return authors
    .map((a: any) => {
      const name = [a.firstName, a.lastName].filter(Boolean).join(' ')
      const aff = a.affiliation ? ` (${a.affiliation})` : ''
      return `${name}${aff}`.trim()
    })
    .filter(Boolean)
    .join('; ')
}

/**
 * POST /api/admin/abstracts/book
 * Generate book of abstracts PDF (default: accepted only).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conferenceId, status = 'accepted' } = body || {}
    if (!conferenceId) throw ApiError.validationError('conferenceId is required')

    const { supabase } = await requireConferencePermission(
      conferenceId,
      'can_manage_abstracts'
    )

    const { data: conference, error: confError } = await supabase
      .from('conferences')
      .select('name, start_date, location')
      .eq('id', conferenceId)
      .single()

    if (confError || !conference) throw ApiError.notFound('Conference not found')

    let query = supabase
      .from('abstracts')
      .select('id, file_name, email, custom_data, authors, status, uploaded_at')
      .eq('conference_id', conferenceId)
      .order('uploaded_at', { ascending: true })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: abstracts, error } = await query
    if (error) throw ApiError.internal('Failed to load abstracts')

    if (!abstracts?.length) {
      throw ApiError.validationError('No abstracts match the selected filter')
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 48
    const maxW = pageW - margin * 2
    let y = margin

    const addPageIfNeeded = (needed: number) => {
      if (y + needed > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        y = margin
      }
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Book of Abstracts', margin, y)
    y += 22

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(conference.name || 'Conference', margin, y)
    y += 16

    const meta = [conference.location, conference.start_date]
      .filter(Boolean)
      .join(' · ')
    if (meta) {
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(meta, margin, y)
      doc.setTextColor(0, 0, 0)
      y += 20
    }

    doc.setFontSize(9)
    doc.text(`${abstracts.length} abstract(s) · status: ${status}`, margin, y)
    y += 24

    abstracts.forEach((abs, index) => {
      const title =
        (abs.custom_data as any)?.abstractTitle ||
        abs.file_name ||
        `Abstract ${index + 1}`
      const authors = formatAuthors(abs.authors)
      const type = (abs.custom_data as any)?.abstractType || ''
      const keywords = (abs.custom_data as any)?.abstractKeywords || ''

      addPageIfNeeded(80)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      const titleLines = doc.splitTextToSize(`${index + 1}. ${title}`, maxW)
      doc.text(titleLines, margin, y)
      y += titleLines.length * 14

      if (authors) {
        addPageIfNeeded(20)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        const authorLines = doc.splitTextToSize(authors, maxW)
        doc.text(authorLines, margin, y)
        y += authorLines.length * 12 + 4
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(90, 90, 90)
      const metaLine = [type && `Type: ${type}`, abs.email && `Contact: ${abs.email}`]
        .filter(Boolean)
        .join(' · ')
      if (metaLine) {
        addPageIfNeeded(14)
        doc.text(metaLine, margin, y)
        y += 12
      }
      if (keywords) {
        addPageIfNeeded(14)
        const kwLines = doc.splitTextToSize(`Keywords: ${keywords}`, maxW)
        doc.text(kwLines, margin, y)
        y += kwLines.length * 10
      }
      doc.setTextColor(0, 0, 0)
      y += 14
    })

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const slug = (conference.name || 'conference')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="book-of-abstracts-${slug}.pdf"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
