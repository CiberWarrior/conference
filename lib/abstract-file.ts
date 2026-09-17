/**
 * Validation + storage path helpers for abstract documents and organizer templates.
 * Shared by the client (early feedback) and the server (authoritative check).
 */

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
export const PDF_MIME = 'application/pdf'

/** Accepted formats for submitted abstract documents (new submissions + revisions). */
export const ABSTRACT_DOCUMENT_MIME_BY_EXTENSION: Record<string, string> = {
  '.docx': DOCX_MIME,
  '.pdf': PDF_MIME,
}
export const ABSTRACT_DOCUMENT_EXTENSIONS = Object.keys(ABSTRACT_DOCUMENT_MIME_BY_EXTENSION)
export const ABSTRACT_DOCUMENT_ACCEPT = ABSTRACT_DOCUMENT_EXTENSIONS.join(',')
export const ABSTRACT_MAX_FILE_BYTES = 10 * 1024 * 1024

/** Accepted format for organizer-provided abstract templates. */
export const ABSTRACT_TEMPLATE_MIME_BY_EXTENSION: Record<string, string> = {
  '.docx': DOCX_MIME,
}
export const ABSTRACT_TEMPLATE_EXTENSIONS = Object.keys(ABSTRACT_TEMPLATE_MIME_BY_EXTENSION)
export const ABSTRACT_TEMPLATE_ACCEPT = ABSTRACT_TEMPLATE_EXTENSIONS.join(',')
export const ABSTRACT_TEMPLATE_MAX_FILE_BYTES = 5 * 1024 * 1024

export type FileValidationResult =
  | { ok: true; extension: string; mimeType: string }
  | { ok: false; error: string; details?: string }

interface FileLike {
  name: string
  type: string
  size: number
}

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  if (idx < 0) return ''
  return fileName.slice(idx).toLowerCase()
}

/**
 * Validate extension, MIME type and size against an allow-list.
 * Both the extension AND the browser-reported MIME type must match the same format.
 * An empty MIME type (some browsers omit it for .docx) is tolerated because the
 * extension is still enforced and the file is only ever served back via signed URL.
 */
function validateAgainst(
  file: FileLike,
  mimeByExtension: Record<string, string>,
  maxBytes: number,
  allowedLabel: string
): FileValidationResult {
  const extension = getFileExtension(file.name)
  const expectedMime = mimeByExtension[extension]

  if (!expectedMime) {
    return {
      ok: false,
      error: 'Invalid file type',
      details: `Only ${allowedLabel} files are allowed`,
    }
  }

  const reportedMime = (file.type || '').toLowerCase()
  if (reportedMime && reportedMime !== expectedMime) {
    return {
      ok: false,
      error: 'File type does not match its extension',
      details: `Expected ${expectedMime} for ${extension}, received ${reportedMime}`,
    }
  }

  if (file.size <= 0) {
    return { ok: false, error: 'File is empty' }
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      error: 'File size too large',
      details: `File size must be less than ${formatMb(maxBytes)}. Current size: ${formatMb(file.size)}`,
    }
  }

  return { ok: true, extension, mimeType: expectedMime }
}

export function validateAbstractFile(file: FileLike): FileValidationResult {
  return validateAgainst(
    file,
    ABSTRACT_DOCUMENT_MIME_BY_EXTENSION,
    ABSTRACT_MAX_FILE_BYTES,
    'Word (.docx) and PDF (.pdf)'
  )
}

export function validateAbstractTemplateFile(file: FileLike): FileValidationResult {
  return validateAgainst(
    file,
    ABSTRACT_TEMPLATE_MIME_BY_EXTENSION,
    ABSTRACT_TEMPLATE_MAX_FILE_BYTES,
    'Word (.docx)'
  )
}

const PDF_MAGIC = Buffer.from('%PDF-', 'ascii')
const ZIP_LOCAL_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const DOCX_CONTENT_TYPES = Buffer.from('[Content_Types].xml', 'ascii')
const DOCX_DOCUMENT = Buffer.from('word/document.xml', 'ascii')

/**
 * Authoritative file-signature check on raw bytes (no unzip / XML parsing).
 * Complements extension + MIME validation before Storage upload.
 */
export function validateFileMagicBytes(
  buffer: Buffer | Uint8Array,
  extension: string
): FileValidationResult {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  const reject = (): FileValidationResult => ({
    ok: false,
    error: 'Invalid file type',
    details: 'File content does not match its extension.',
  })

  if (extension === '.pdf') {
    if (buf.length < PDF_MAGIC.length || !buf.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
      return reject()
    }
    return { ok: true, extension, mimeType: PDF_MIME }
  }

  if (extension === '.docx') {
    if (buf.length < ZIP_LOCAL_HEADER.length || !buf.subarray(0, ZIP_LOCAL_HEADER.length).equals(ZIP_LOCAL_HEADER)) {
      return reject()
    }
    if (!buf.includes(DOCX_CONTENT_TYPES) || !buf.includes(DOCX_DOCUMENT)) {
      return reject()
    }
    return { ok: true, extension, mimeType: DOCX_MIME }
  }

  return reject()
}

/** Strip path separators and anything outside a conservative safe set; keep it short. */
export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() || 'document'
  const extension = getFileExtension(base)
  const stem = extension ? base.slice(0, -extension.length) : base
  const safeStem = stem.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '').slice(0, 80) || 'document'
  return `${safeStem}${extension}`
}

/** {conference_id}/{abstract_id}/{timestamp}_{sanitized} — never derived from user-provided paths. */
export function buildAbstractStoragePath(
  conferenceId: string,
  abstractId: string,
  fileName: string
): string {
  return `${conferenceId}/${abstractId}/${Date.now()}_${sanitizeFileName(fileName)}`
}

/** {conference_id}/{timestamp}_{sanitized} inside the conference-templates bucket. */
export function buildTemplateStoragePath(conferenceId: string, fileName: string): string {
  return `${conferenceId}/${Date.now()}_${sanitizeFileName(fileName)}`
}
