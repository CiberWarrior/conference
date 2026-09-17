/**
 * Shared helpers for presenting abstracts and their reviews (admin + reviewer + exports).
 */

export type AbstractStatus =
  | 'pending'
  | 'under_review'
  | 'revise'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export const ABSTRACT_STATUSES: AbstractStatus[] = [
  'pending',
  'under_review',
  'revise',
  'accepted',
  'rejected',
  'withdrawn',
]

export interface AbstractAuthorLike {
  firstName?: string
  lastName?: string
  email?: string
  affiliations?: string[]
  /** Legacy single-institution field */
  affiliation?: string
  country?: string
  city?: string
  isCorresponding?: boolean
}

export interface AbstractLike {
  title?: string | null
  file_name?: string | null
  file_path?: string | null
  custom_data?: Record<string, unknown> | null
  authors?: AbstractAuthorLike[] | null
}

export type SubmissionMethod = 'online_form' | 'document_upload'

/**
 * Resolve how an abstract was submitted.
 * New rows persist `custom_data.submissionMethod`; legacy rows are inferred:
 * a stored file without form text is treated as a document submission.
 */
export function getSubmissionMethod(abstract: AbstractLike): SubmissionMethod {
  const stored = abstract.custom_data?.submissionMethod
  if (stored === 'document_upload' || stored === 'online_form') return stored
  if (abstract.file_path && !customValue(abstract, 'abstractContent')) {
    return 'document_upload'
  }
  return 'online_form'
}

export function isDocumentUploadAbstract(abstract: AbstractLike): boolean {
  return getSubmissionMethod(abstract) === 'document_upload'
}

export interface ReviewLike {
  id: string
  abstract_id: string
  score?: number | null
  comments?: string | null
  recommendation?: string | null
  submitted_at?: string | null
  reviewer?: { id: string; email?: string | null; name?: string | null } | null
}

export interface ReviewSummary {
  total: number
  submitted: number
  pending: number
  averageScore: number | null
  accept: number
  revise: number
  reject: number
}

function customValue(abstract: AbstractLike, key: string): string | null {
  const raw = abstract.custom_data?.[key]
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Prefer the dedicated title column, fall back to custom_data, then file name. */
export function getAbstractTitle(abstract: AbstractLike, fallback = ''): string {
  const title = abstract.title?.trim()
  if (title) return title
  return customValue(abstract, 'abstractTitle') || abstract.file_name || fallback
}

export function getAbstractContent(abstract: AbstractLike): string | null {
  return customValue(abstract, 'abstractContent')
}

export function getAbstractKeywords(abstract: AbstractLike): string | null {
  return customValue(abstract, 'abstractKeywords')
}

export function getAbstractType(abstract: AbstractLike): string | null {
  return customValue(abstract, 'abstractType')
}

/**
 * All institutions for one author, cleaned and de-duplicated.
 * Falls back to the legacy single `affiliation` field.
 */
export function getAuthorAffiliations(
  author: AbstractAuthorLike | null | undefined
): string[] {
  if (!author) return []
  const raw = Array.isArray(author.affiliations)
    ? author.affiliations
    : author.affiliation
      ? [author.affiliation]
      : []

  const seen = new Set<string>()
  const result: string[] = []
  for (const entry of raw) {
    const value = typeof entry === 'string' ? entry.trim() : ''
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }
  return result
}

export function getAuthorFullName(author: AbstractAuthorLike): string {
  return [author.firstName, author.lastName].filter(Boolean).join(' ').trim()
}

/** "Ana Horvat (PMF, IRB); Ivan Ivić (FER)" — affiliations optional. */
export function formatAuthorList(
  authors: AbstractAuthorLike[] | null | undefined,
  options: { withAffiliation?: boolean } = {}
): string {
  if (!Array.isArray(authors) || authors.length === 0) return ''
  return authors
    .map((author) => {
      const name = getAuthorFullName(author)
      if (!name) return ''
      if (!options.withAffiliation) return name
      const affiliations = getAuthorAffiliations(author)
      return affiliations.length > 0 ? `${name} (${affiliations.join(', ')})` : name
    })
    .filter(Boolean)
    .join('; ')
}

/** Unique affiliations across all authors, in author order, for book-of-abstracts footnotes. */
export function collectAffiliations(
  authors: AbstractAuthorLike[] | null | undefined
): string[] {
  if (!Array.isArray(authors)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const author of authors) {
    for (const affiliation of getAuthorAffiliations(author)) {
      if (seen.has(affiliation)) continue
      seen.add(affiliation)
      result.push(affiliation)
    }
  }
  return result
}

/**
 * Academic citation format: a numbered affiliation list plus the 1-based indices
 * each author belongs to, e.g. "Ana Horvat (1,2); Ivan Ivić (2)".
 */
export function buildAuthorCitation(authors: AbstractAuthorLike[] | null | undefined): {
  authorLine: string
  affiliations: string[]
} {
  const affiliations = collectAffiliations(authors)
  if (!Array.isArray(authors) || authors.length === 0) {
    return { authorLine: '', affiliations }
  }

  const indexOf = new Map(affiliations.map((a, i) => [a, i + 1]))
  const authorLine = authors
    .map((author) => {
      const name = getAuthorFullName(author)
      if (!name) return ''
      const marks = getAuthorAffiliations(author)
        .map((a) => indexOf.get(a))
        .filter((n): n is number => typeof n === 'number')
      return marks.length > 0 ? `${name} (${marks.join(',')})` : name
    })
    .filter(Boolean)
    .join(', ')

  return { authorLine, affiliations }
}

export function getCorrespondingAuthorEmail(
  authors: AbstractAuthorLike[] | null | undefined
): string | null {
  if (!Array.isArray(authors)) return null
  const corresponding = authors.find((a) => a.isCorresponding && a.email)
  return corresponding?.email || authors.find((a) => a.email)?.email || null
}

export function summarizeReviews(reviews: ReviewLike[]): ReviewSummary {
  const submitted = reviews.filter((r) => r.submitted_at)
  const scores = submitted
    .map((r) => r.score)
    .filter((s): s is number => typeof s === 'number')

  return {
    total: reviews.length,
    submitted: submitted.length,
    pending: reviews.length - submitted.length,
    averageScore:
      scores.length > 0
        ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
        : null,
    accept: submitted.filter((r) => r.recommendation === 'accept').length,
    revise: submitted.filter((r) => r.recommendation === 'revise').length,
    reject: submitted.filter((r) => r.recommendation === 'reject').length,
  }
}

export function groupReviewsByAbstract(reviews: ReviewLike[]): Record<string, ReviewLike[]> {
  return reviews.reduce<Record<string, ReviewLike[]>>((acc, review) => {
    const key = review.abstract_id
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(review)
    return acc
  }, {})
}

/**
 * Deadline is inclusive: submissions are allowed until 23:59:59 of the configured day.
 */
export function isAbstractDeadlinePassed(
  deadline: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!deadline) return false
  const parsed = new Date(`${deadline.slice(0, 10)}T23:59:59`)
  if (Number.isNaN(parsed.getTime())) return false
  return now.getTime() > parsed.getTime()
}
