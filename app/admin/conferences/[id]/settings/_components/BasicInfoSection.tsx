/**
 * Basic Info Section - Conference name, description, dates, location
 */

import { useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import type { OnFormDataChange, ConferenceFormData } from './types'

interface BasicInfoSectionProps {
  formData: ConferenceFormData
  onChange: OnFormDataChange
}

export default function BasicInfoSection({ formData, onChange }: BasicInfoSectionProps) {
  const t = useTranslations('admin.conferences')

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5 text-blue-600" />
        {t('basicInformation')}
      </h2>

      <div className="space-y-4">
        {/* Conference Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Conference Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            {t('descriptionLabelShort')}
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dates, Location, Venue, Website in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('startDateLabel')}
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={(e) => onChange({ start_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('endDateLabel')}
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={(e) => onChange({ end_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={(e) => onChange({ location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('locationPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="venue" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('venueLabelShort')}
            </label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={(e) => onChange({ venue: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="website_url" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('websiteUrlLabelShort')}
            </label>
            <input
              type="url"
              id="website_url"
              name="website_url"
              value={formData.website_url}
              onChange={(e) => onChange({ website_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-semibold text-gray-700 mb-2">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={(e) => onChange({ timezone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Europe/Zagreb">Europe/Zagreb (CET)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
