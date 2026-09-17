import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  PageNumber,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import {
  buildAuthorCitation,
  getAbstractContent,
  getAbstractKeywords,
  getAbstractTitle,
  getAbstractType,
  isDocumentUploadAbstract,
} from '@/lib/abstract-display'

export interface BookOfAbstractsConference {
  name?: string | null
  start_date?: string | null
  end_date?: string | null
  location?: string | null
}

export interface BookOfAbstractsOptions {
  conference: BookOfAbstractsConference
  abstracts: Array<Record<string, any>>
  status: string
  includeContent?: boolean
  includeContact?: boolean
}

const GREY = '6B7280'

function text(
  value: string,
  options: {
    bold?: boolean
    italics?: boolean
    /** Font size in points */
    pt?: number
    color?: string
  } = {}
) {
  return new TextRun({
    text: value,
    bold: options.bold,
    italics: options.italics,
    size: (options.pt ?? 11) * 2, // docx expects half-points
    color: options.color,
  })
}

function formatDateRange(conference: BookOfAbstractsConference): string {
  return [conference.start_date, conference.end_date]
    .filter(Boolean)
    .map((d) => new Date(d as string).toLocaleDateString('en-GB'))
    .join(' – ')
}

/**
 * Build an editable Word version of the book of abstracts.
 * Unlike the PDF export this keeps full Unicode, so Croatian diacritics render correctly.
 */
export async function buildBookOfAbstractsDocx({
  conference,
  abstracts,
  status,
  includeContent = true,
  includeContact = false,
}: BookOfAbstractsOptions): Promise<ArrayBuffer> {
  const children: Paragraph[] = []

  // ---- Title page ----
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [text('Book of Abstracts', { bold: true, pt: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [text(conference.name || 'Conference', { pt: 15 })],
    })
  )

  const meta = [conference.location, formatDateRange(conference)].filter(Boolean).join(' · ')
  if (meta) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [text(meta, { pt: 11, color: GREY })],
      })
    )
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [
        text(`${abstracts.length} abstract(s) · status: ${status}`, {
          pt: 9,
          color: GREY,
        }),
      ],
    })
  )

  // ---- Contents ----
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
      children: [text('Contents', { bold: true, pt: 15 })],
    })
  )

  abstracts.forEach((abstract, index) => {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          text(`${index + 1}. ${getAbstractTitle(abstract, `Abstract ${index + 1}`)}`, {
            pt: 10,
          }),
        ],
      })
    )
  })

  // ---- Abstracts, one per page ----
  abstracts.forEach((abstract, index) => {
    const title = getAbstractTitle(abstract, `Abstract ${index + 1}`)
    const { authorLine, affiliations } = buildAuthorCitation(abstract.authors)
    const type = getAbstractType(abstract)
    const keywords = getAbstractKeywords(abstract)
    const content = getAbstractContent(abstract)

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { after: 160 },
        children: [text(`${index + 1}. ${title}`, { bold: true, pt: 14 })],
      })
    )

    if (authorLine) {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [text(authorLine, { italics: true, pt: 11 })],
        })
      )
    }

    affiliations.forEach((affiliation, i) => {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [text(`(${i + 1}) ${affiliation}`, { pt: 9, color: GREY })],
        })
      )
    })

    if (type) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [text(`Presentation: ${type}`, { pt: 10, color: GREY })],
        })
      )
    }

    if (includeContact && abstract.email) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [text(`Contact: ${abstract.email}`, { pt: 10, color: GREY })],
        })
      )
    }

    if (includeContent && content) {
      // Preserve the author's paragraph breaks
      const paragraphs = content.split(/\n{2,}/).filter((p) => p.trim())
      paragraphs.forEach((paragraph, i) => {
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: i === 0 ? 200 : 0, after: 120, line: 300 },
            children: [text(paragraph.replace(/\n/g, ' ').trim(), { pt: 11 })],
          })
        )
      })
    } else if (includeContent && isDocumentUploadAbstract(abstract)) {
      // Document submissions are not parsed; only stored metadata is exported.
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [
            text(
              `Abstract submitted as a document${abstract.file_name ? ` (${abstract.file_name})` : ''}.`,
              { italics: true, pt: 10, color: GREY }
            ),
          ],
        })
      )
    }

    if (keywords) {
      children.push(
        new Paragraph({
          spacing: { before: 160 },
          children: [text(`Keywords: ${keywords}`, { italics: true, pt: 10, color: GREY })],
        })
      )
    }
  })

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: GREY,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  return Packer.toArrayBuffer(doc)
}
