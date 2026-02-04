'use client'

import { useTranslations } from 'next-intl'
import type { ConferenceFormData, OnFormDataChange } from './types'

interface GeneralSettingsSectionProps {
  formData: ConferenceFormData
  onChange: OnFormDataChange
}

export default function GeneralSettingsSection({ formData, onChange }: GeneralSettingsSectionProps) {
  const t = useTranslations('admin.conferences')

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('conferenceSettings')}</h2>
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.registration_enabled}
            onChange={(e) => onChange({ registration_enabled: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">{t('registrationEnabled')}</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.abstract_submission_enabled}
            onChange={(e) => onChange({ abstract_submission_enabled: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">{t('abstractSubmissionEnabled')}</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.payment_required}
            onChange={(e) => onChange({ payment_required: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">{t('paymentRequired')}</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('maxRegistrations')}</label>
          <input
            type="text"
            value={formData.max_registrations}
            onChange={(e) => onChange({ max_registrations: e.target.value })}
            placeholder="0 = unlimited"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('timezone')}</label>
          <input
            type="text"
            value={formData.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
            placeholder="Europe/Zagreb"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
