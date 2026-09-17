import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import {
  buildAbstractStoragePath,
  buildTemplateStoragePath,
  validateAbstractFile,
  validateAbstractTemplateFile,
  validateFileMagicBytes,
} from '@/lib/abstract-file'
import { log } from '@/lib/logger'

export const ABSTRACTS_BUCKET = 'abstracts'
export const TEMPLATES_BUCKET = 'conference-templates'

/** Short-lived download links: 5 minutes is enough for a click-to-download flow. */
export const SIGNED_URL_TTL_SECONDS = 300

export interface StoredFile {
  file_name: string
  file_path: string
  file_size: number
}

/**
 * Upload a validated abstract document with the service-role client.
 * Path is always generated server-side ({conference}/{abstract}/{ts}_{name}).
 * Throws on validation or storage failure; callers handle cleanup.
 */
export async function uploadAbstractDocument(params: {
  conferenceId: string
  abstractId: string
  file: File
}): Promise<StoredFile> {
  const validation = validateAbstractFile(params.file)
  if (!validation.ok) {
    throw new AbstractFileError(validation.error, validation.details)
  }

  const filePath = buildAbstractStoragePath(params.conferenceId, params.abstractId, params.file.name)
  const buffer = Buffer.from(await params.file.arrayBuffer())

  const magicValidation = validateFileMagicBytes(buffer, validation.extension)
  if (!magicValidation.ok) {
    throw new AbstractFileError(magicValidation.error, magicValidation.details)
  }

  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(ABSTRACTS_BUCKET).upload(filePath, buffer, {
    contentType: validation.mimeType,
    upsert: false,
  })

  if (error) {
    log.error('Abstract document upload failed', error, {
      conferenceId: params.conferenceId,
      abstractId: params.abstractId,
      filePath,
    })
    throw new Error('Failed to store abstract document')
  }

  return {
    file_name: params.file.name,
    file_path: filePath,
    file_size: params.file.size,
  }
}

export async function uploadAbstractTemplate(params: {
  conferenceId: string
  file: File
}): Promise<StoredFile> {
  const validation = validateAbstractTemplateFile(params.file)
  if (!validation.ok) {
    throw new AbstractFileError(validation.error, validation.details)
  }

  const filePath = buildTemplateStoragePath(params.conferenceId, params.file.name)
  const buffer = Buffer.from(await params.file.arrayBuffer())

  const magicValidation = validateFileMagicBytes(buffer, validation.extension)
  if (!magicValidation.ok) {
    throw new AbstractFileError(magicValidation.error, magicValidation.details)
  }

  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(TEMPLATES_BUCKET).upload(filePath, buffer, {
    contentType: validation.mimeType,
    upsert: false,
  })

  if (error) {
    log.error('Abstract template upload failed', error, {
      conferenceId: params.conferenceId,
      filePath,
    })
    throw new Error('Failed to store abstract template')
  }

  return {
    file_name: params.file.name,
    file_path: filePath,
    file_size: params.file.size,
  }
}

/** Best-effort delete; never throws (used for rollback and template replacement). */
export async function removeStorageObject(bucket: string, filePath: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.storage.from(bucket).remove([filePath])
    if (error) log.warn('Storage object cleanup failed', { bucket, filePath, error })
  } catch (err) {
    log.warn('Storage object cleanup threw', { bucket, filePath, error: err })
  }
}

/**
 * Create a short-lived signed URL. Callers MUST perform authorization first —
 * this helper only guards that the path sits under the expected conference folder,
 * as a last line of defence against cross-tenant access.
 */
export async function createScopedSignedUrl(params: {
  bucket: string
  filePath: string
  conferenceId: string
  downloadName?: string
}): Promise<string> {
  if (!params.filePath.startsWith(`${params.conferenceId}/`)) {
    throw new Error('Storage path does not belong to this conference')
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(params.bucket)
    .createSignedUrl(params.filePath, SIGNED_URL_TTL_SECONDS, {
      download: params.downloadName || true,
    })

  if (error || !data?.signedUrl) {
    log.error('Failed to create signed URL', error ?? undefined, {
      bucket: params.bucket,
      filePath: params.filePath,
    })
    throw new Error('Failed to create download link')
  }

  return data.signedUrl
}

export class AbstractFileError extends Error {
  details?: string
  constructor(message: string, details?: string) {
    super(message)
    this.name = 'AbstractFileError'
    this.details = details
  }
}
