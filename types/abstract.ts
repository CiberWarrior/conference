export interface AbstractUpload {
  file: File
  email?: string
  registrationId?: string
}

export interface Abstract {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  email?: string | null
  registrationId?: string | null
  uploadedAt: string
}

export interface AbstractFormData {
  file: File | null
  email?: string
  registrationId?: string
}

