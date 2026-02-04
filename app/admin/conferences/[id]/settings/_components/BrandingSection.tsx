/**
 * Branding Section - Logo upload and primary color
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Palette } from 'lucide-react'
import Image from 'next/image'
import type { OnFormDataChange, ConferenceFormData } from './types'
import { showSuccess, showError } from '@/utils/toast'

interface BrandingSectionProps {
  conferenceId: string
  formData: ConferenceFormData
  currentLogoUrl?: string
  onChange: OnFormDataChange
}

export default function BrandingSection({
  conferenceId,
  formData,
  currentLogoUrl,
  onChange,
}: BrandingSectionProps) {
  const t = useTranslations('admin.conferences')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError(t('invalidFileType'))
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError(t('fileTooLarge'))
      return
    }

    try {
      setUploadingLogo(true)

      const formData = new FormData()
      formData.append('logo', file)
      formData.append('conferenceId', conferenceId)

      const response = await fetch('/api/admin/conferences/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.logoUrl) {
        onChange({ logo_url: data.logoUrl })
        showSuccess(t('logoUploaded'))
      } else {
        showError(data.error || t('uploadFailed'))
      }
    } catch (error) {
      showError(t('uploadFailed'))
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Palette className="w-5 h-5 text-purple-600" />
        Branding & Visual Identity
      </h2>

      <div className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('conferenceLogo')}
          </label>
          <div className="flex items-start gap-4">
            {currentLogoUrl && (
              <div className="flex-shrink-0">
                <Image
                  src={currentLogoUrl}
                  alt={t('currentLogo')}
                  width={120}
                  height={120}
                  className="w-24 h-24 object-contain border-2 border-gray-200 rounded-lg p-2 bg-gray-50"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="file"
                  id="logo_upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {uploadingLogo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">{t('uploading')}</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {t('uploadLogoHint')}
              </p>
              <input
                type="url"
                placeholder={t('orEnterLogoUrl')}
                value={formData.logo_url || ''}
                onChange={(e) => onChange({ logo_url: e.target.value })}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Primary Color */}
        <div>
          <label htmlFor="primary_color" className="block text-sm font-semibold text-gray-700 mb-2">
            {t('brandColorLabelShort')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="primary_color"
              name="primary_color"
              value={formData.primary_color}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              className="w-16 h-12 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.primary_color}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
