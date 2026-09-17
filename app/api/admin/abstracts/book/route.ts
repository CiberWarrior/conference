import { NextRequest, NextResponse } from 'next/server'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import {
  buildAuthorCitation,
  getAbstractContent,
  getAbstractKeywords,
  getAbstractTitle,
  getAbstractType,
  isDocumentUploadAbstract,
} from '@/lib/abstract-display'
import { buildBookOfAbstractsDocx } from '@/lib/book-of-abstracts-docx'
import jsPDF from 'jspdf'

export const dynamic = 'force-dynamic'

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/**
 * POST /api/admin/abstracts/book
 * Generate book of abstracts as PDF or Word (default: accepted only, PDF).
 * body: { conferenceId, status?, format?: 'pdf' | 'docx', includeContent?, includeContact? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conferenceId,
      status = 'accepted',
      format = 'pdf',
      includeContent = true,
      includeContact = false,
    } = body || {}
    if (!conferenceId) throw ApiError.validationError('conferenceId is required')
    if (format !== 'pdf' && format !== 'docx') {
      throw ApiError.validationError("format must be 'pdf' or 'docx'")
    }

    const { supabase } = await requireConferencePermission(
      conferenceId,
      'can_manage_abstracts'
    )

    const { data: conference, error: confError } = await supabase
      .from('conferences')
      .select('name, start_date, end_date, location')
      .eq('id', conferenceId)
      .single()

    if (confError || !conference) throw ApiError.notFound('Conference not found')

    let query = supabase
      .from('abstracts')
      .select('id, file_name, file_path, title, email, custom_data, authors, status, uploaded_at')
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

    const slug = (conference.name || 'conference')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40)

    if (format === 'docx') {
      const docxBody = await buildBookOfAbstractsDocx({
        conference,
        abstracts,
        status,
        includeContent,
        includeContact,
      })

      return new NextResponse(docxBody, {
        status: 200,
        headers: {
          'Content-Type': DOCX_CONTENT_TYPE,
          'Content-Disposition': `attachment; filename="book-of-abstracts-${slug}.docx"`,
        },
      })
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 56
    const maxW = pageW - margin * 2
    let y = margin

    const addPageIfNeeded = (needed: number) => {
      if (y + needed > pageH - margin) {
        doc.addPage()
        y = margin
      }
    }

    const writeBlock = (
      text: string,
      options: {
        size: number
        style?: 'normal' | 'bold' | 'italic'
        lineHeight?: number
        color?: [number, number, number]
        spaceAfter?: number
      }
    ) => {
      const { size, style = 'normal', color = [0, 0, 0] } = options
      const lineHeight = options.lineHeight ?? size * 1.35
      doc.setFont('helvetica', style)
      doc.setFontSize(size)
      doc.setTextColor(...color)
      for (const line of doc.splitTextToSize(text, maxW)) {
        addPageIfNeeded(lineHeight)
        doc.text(line, margin, y)
        y += lineHeight
      }
      doc.setTextColor(0, 0, 0)
      y += options.spaceAfter ?? 0
    }

    // ---- Title page ----
    writeBlock('Book of Abstracts', { size: 22, style: 'bold', spaceAfter: 8 })
    writeBlock(conference.name || 'Conference', { size: 14, spaceAfter: 4 })

    const dateRange = [conference.start_date, conference.end_date]
      .filter(Boolean)
      .map((d) => new Date(d as string).toLocaleDateString('en-GB'))
      .join(' – ')
    const meta = [conference.location, dateRange].filter(Boolean).join(' · ')
    if (meta) {
      writeBlock(meta, { size: 10, color: [100, 100, 100], spaceAfter: 6 })
    }
    writeBlock(`${abstracts.length} abstract(s) · status: ${status}`, {
      size: 9,
      color: [120, 120, 120],
      spaceAfter: 18,
    })

    // ---- Table of contents ----
    writeBlock('Contents', { size: 13, style: 'bold', spaceAfter: 6 })
    abstracts.forEach((abs, index) => {
      writeBlock(`${index + 1}. ${getAbstractTitle(abs, `Abstract ${index + 1}`)}`, {
        size: 9,
        lineHeight: 13,
        color: [70, 70, 70],
      })
    })

    // ---- Abstracts ----
    abstracts.forEach((abs, index) => {
      doc.addPage()
      y = margin

      const title = getAbstractTitle(abs, `Abstract ${index + 1}`)
      const { authorLine, affiliations } = buildAuthorCitation(abs.authors as any)
      const type = getAbstractType(abs)
      const keywords = getAbstractKeywords(abs)
      const content = getAbstractContent(abs)

      writeBlock(`${index + 1}. ${title}`, { size: 13, style: 'bold', spaceAfter: 6 })

      if (authorLine) {
        writeBlock(authorLine, { size: 10, style: 'italic', spaceAfter: 2 })
      }

      affiliations.forEach((affiliation, i) => {
        writeBlock(`(${i + 1}) ${affiliation}`, {
          size: 8,
          lineHeight: 11,
          color: [110, 110, 110],
        })
      })
      if (affiliations.length > 0) y += 6

      if (type) {
        writeBlock(`Presentation: ${type}`, {
          size: 9,
          color: [90, 90, 90],
          spaceAfter: 2,
        })
      }

      if (includeContact && abs.email) {
        writeBlock(`Contact: ${abs.email}`, {
          size: 9,
          color: [90, 90, 90],
          spaceAfter: 2,
        })
      }

      y += 8

      if (includeContent && content) {
        writeBlock(content, { size: 10, lineHeight: 15, spaceAfter: 10 })
      } else if (includeContent && isDocumentUploadAbstract(abs)) {
        // Document submissions are not parsed; only stored metadata is exported.
        writeBlock(
          `Abstract submitted as a document${abs.file_name ? ` (${abs.file_name})` : ''}.`,
          { size: 9, style: 'italic', color: [110, 110, 110], spaceAfter: 10 }
        )
      }

      if (keywords) {
        writeBlock(`Keywords: ${keywords}`, {
          size: 9,
          style: 'italic',
          color: [90, 90, 90],
        })
      }
    })

    // ---- Page numbers ----
    const pageCount = doc.getNumberOfPages()
    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(140, 140, 140)
      doc.text(`${page} / ${pageCount}`, pageW - margin, pageH - 24, { align: 'right' })
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

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
