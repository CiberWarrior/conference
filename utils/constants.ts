/**
 * Application constants
 * Centralized constants used throughout the app
 */

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  'pdf',
  'doc',
  'docx',
  'jpg',
  'jpeg',
  'png',
]

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

// Currency
export const DEFAULT_CURRENCY = 'EUR'

// Status values
export const REGISTRATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const

export const INQUIRY_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
} as const

// Export formats
export const EXPORT_FORMATS = {
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json',
  PDF: 'pdf',
} as const

