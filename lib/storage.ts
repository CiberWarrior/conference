/**
 * Storage helper functions for organizing files in Supabase Storage
 * 
 * This module provides utilities for creating organized file paths
 * following best practices similar to digitalnisuperheroj.com
 */

/**
 * Generate organized file path for abstracts
 * Structure: abstracts/{registrationId}/{filename}
 * If no registrationId, uses email hash or timestamp
 */
export function getAbstractFilePath(
  fileName: string,
  registrationId?: string | null,
  email?: string | null
): string {
  const sanitizedFileName = sanitizeFileName(fileName)
  const timestamp = Date.now()
  const uniqueFileName = `${timestamp}_${sanitizedFileName}`

  // If registrationId is provided, organize by registration
  if (registrationId) {
    return `abstracts/${registrationId}/${uniqueFileName}`
  }

  // If email is provided but no registrationId, use email hash
  if (email) {
    // Simple hash function for email (for folder organization)
    const emailHash = hashEmail(email)
    return `abstracts/by-email/${emailHash}/${uniqueFileName}`
  }

  // Fallback: organize by date if no identifiers
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `abstracts/${year}/${month}/${uniqueFileName}`
}

/**
 * Generate file path for invoices
 * Structure: invoices/{registrationId}/invoice-{invoiceId}.pdf
 */
export function getInvoiceFilePath(
  registrationId: string,
  invoiceId: string
): string {
  return `invoices/${registrationId}/invoice-${invoiceId}.pdf`
}

/**
 * Generate file path for profile images
 * Structure: profile-images/{userId}/{imageId}.jpg
 */
export function getProfileImagePath(userId: string, imageId: string): string {
  return `profile-images/${userId}/${imageId}.jpg`
}

/**
 * Sanitize filename to prevent path traversal and special characters
 */
function sanitizeFileName(fileName: string): string {
  // Remove any path components
  const name = fileName.replace(/^.*[\\/]/, '')
  // Replace spaces and special characters, keep alphanumeric, dots, hyphens, underscores
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * Simple hash function for email (for folder organization)
 * Creates a consistent hash from email address
 */
function hashEmail(email: string): string {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & 0xffffffff // Convert to 32-bit integer
  }
  // Return positive hash as hex string
  return Math.abs(hash).toString(16).substring(0, 8)
}

/**
 * Extract registration ID from file path
 * Useful for migration or cleanup operations
 */
export function extractRegistrationIdFromPath(filePath: string): string | null {
  const match = filePath.match(/^abstracts\/([a-f0-9-]{36})\//)
  return match ? match[1] : null
}

/**
 * Get all file paths for a specific registration
 * Useful for cleanup when registration is deleted
 */
export function getAbstractPathsForRegistration(registrationId: string): string {
  return `abstracts/${registrationId}/`
}

