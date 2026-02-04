'use client'

import type { ConferenceFormData, OnFormDataChange } from './types'

interface PublishingSectionProps {
  formData: ConferenceFormData
  onChange: OnFormDataChange
}

export default function PublishingSection({ formData, onChange }: PublishingSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <p className="text-sm text-gray-500">
        Publishing options are configured inline in settings page.
      </p>
    </div>
  )
}
