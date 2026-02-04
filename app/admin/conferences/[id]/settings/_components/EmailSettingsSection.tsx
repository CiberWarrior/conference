'use client'

import { useTranslations } from 'next-intl'
import type { ConferenceFormData, OnFormDataChange } from './types'

interface EmailSettingsSectionProps {
  formData: ConferenceFormData
  onChange: OnFormDataChange
}

export default function EmailSettingsSection({ formData, onChange }: EmailSettingsSectionProps) {
  const t = useTranslations('admin.conferences')

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('emailSettings')}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fromEmail')}</label>
          <input
            type="email"
            value={formData.from_email}
            onChange={(e) => onChange({ from_email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fromName')}</label>
          <input
            type="text"
            value={formData.from_name}
            onChange={(e) => onChange({ from_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('replyTo')}</label>
          <input
            type="email"
            value={formData.reply_to}
            onChange={(e) => onChange({ reply_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
