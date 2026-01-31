'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Globe, GripVertical } from 'lucide-react'
import type { CustomRegistrationField } from '@/types/conference'
import { getTranslatedFieldLabelKey } from '@/lib/registration-field-labels'

// List of all countries in the world
const WORLD_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas',
  'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize',
  'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China',
  'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba',
  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',
  'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia',
  'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste',
  'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe'
]

interface CollapsibleFieldEditorProps {
  field: CustomRegistrationField
  index: number
  onUpdate: (id: string, updates: Partial<CustomRegistrationField>) => void
  onRemove: (id: string) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

export default function CollapsibleFieldEditor({
  field,
  index,
  onUpdate,
  onRemove,
  isExpanded,
  onToggleExpand,
}: CollapsibleFieldEditorProps) {
  const t = useTranslations('admin.conferences')
  const labelKey = getTranslatedFieldLabelKey(field.name, field.label)
  const displayLabel = labelKey ? t(labelKey) : (field.label || t('untitledField'))
  return (
    <div
      className={`bg-gray-50 rounded-lg border transition-all ${
        isExpanded ? 'border-blue-500 shadow-md' : 'border-gray-200'
      }`}
    >
      {/* Collapsed Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div 
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-5 h-5" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
            <span className="text-sm font-bold text-gray-900">
              {displayLabel}
            </span>
          </div>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {field.type === 'text' && t('fieldTypeText')}
            {field.type === 'textarea' && t('fieldTypeTextarea')}
            {field.type === 'longtext' && t('fieldTypeLongtext')}
            {field.type === 'email' && t('fieldTypeEmail')}
            {field.type === 'tel' && t('fieldTypeTel')}
            {field.type === 'number' && t('fieldTypeNumber')}
            {field.type === 'date' && t('fieldTypeDate')}
            {field.type === 'select' && t('fieldTypeSelect')}
            {field.type === 'radio' && t('fieldTypeRadio')}
            {field.type === 'checkbox' && t('fieldTypeCheckbox')}
            {field.type === 'file' && t('fieldTypeFile')}
            {(field.type as string) === 'separator' && t('fieldTypeSeparator')}
          </span>
          {field.required && (field.type as string) !== 'separator' && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">{t('required')}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(field.id)
            }}
            className="text-red-600 hover:text-red-700 transition-colors p-1"
            title={t('removeField')}
          >
            <X className="w-5 h-5" />
          </button>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-5 space-y-4">
          {(field.type as string) === 'separator' ? (
            // Separator-specific fields (simplified)
            <>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-sm font-semibold text-purple-900">{t('sectionSeparator')}</span>
                </div>
                <p className="text-xs text-purple-700">
                  {t('sectionSeparatorDesc')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('fieldNameInternalStar')}
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => onUpdate(field.id, { name: e.target.value })}
                    placeholder={t('placeholderAuthorSeparator')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('usedInternally')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('sectionTitleDisplayStar')}
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                    placeholder={t('placeholderAuthor2Title')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('titleShownAsSectionHeader')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('descriptionHelpTextOptional')}
                </label>
                <textarea
                  value={field.description || ''}
                  onChange={(e) => onUpdate(field.id, { description: e.target.value || undefined })}
                  placeholder={t('placeholderOptionalDescription')}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            // Regular field configuration
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('fieldNameInternalStar')}
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => onUpdate(field.id, { name: e.target.value })}
                    placeholder={t('placeholderFieldName')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('usedInternally')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('fieldLabelDisplayStar')}
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                    placeholder={t('placeholderFieldName')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('shownToUsersInForm')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('fieldTypeLabel')}
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      onUpdate(field.id, {
                        type: e.target.value as CustomRegistrationField['type'],
                        options: (e.target.value === 'select' || e.target.value === 'radio') ? [] : undefined,
                        required: e.target.value === 'separator' ? false : field.required,
                        fileTypes: e.target.value === 'file' ? ['.pdf', '.doc', '.docx'] : undefined,
                        maxFileSize: e.target.value === 'file' ? 10 : undefined,
                        validation: e.target.value === 'longtext' ? { maxLength: 5000 } : field.validation,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">{t('optionTextShort')}</option>
                    <option value="textarea">{t('optionTextareaLong')}</option>
                    <option value="longtext">{t('optionLongtextPaste')}</option>
                    <option value="file">{t('optionFileUpload')}</option>
                    <option value="number">{t('optionNumber')}</option>
                    <option value="email">{t('optionEmail')}</option>
                    <option value="tel">{t('optionPhoneNumber')}</option>
                    <option value="date">{t('optionDate')}</option>
                    <option value="select">{t('optionDropdownSelect')}</option>
                    <option value="radio">{t('optionRadioButtons')}</option>
                    <option value="checkbox">{t('optionCheckbox')}</option>
                    <option value="separator">{t('optionSeparatorBreak')}</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer pt-8">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
                      disabled={(field.type as string) === 'separator'}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-semibold text-gray-700">{t('requiredField')}</span>
                  </label>
                  {(field.type as string) === 'separator' && (
                    <p className="text-xs text-gray-500 mt-1">{t('separatorsNeverRequired')}</p>
                  )}
                </div>
              </div>

              {(field.type === 'select' || field.type === 'radio') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {t('optionsOnePerLine')}
                </label>
                {field.type === 'select' && (
                  <button
                    type="button"
                    onClick={() => onUpdate(field.id, { options: WORLD_COUNTRIES })}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    <Globe className="w-3 h-3" />
                    {t('loadAllCountries')}
                  </button>
                )}
              </div>
              <textarea
                value={field.options?.join('\n') || ''}
                onChange={(e) =>
                  onUpdate(field.id, {
                    options: e.target.value.split('\n').filter((opt) => opt.trim()),
                  })
                }
                placeholder={
                  field.type === 'radio'
                    ? t('placeholderOptionsRadio')
                    : t('placeholderOptionsSelect')
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('enterEachOptionOnNewLine')}
                {field.type === 'select' && <span className="font-semibold"> • {t('orClickLoadAllCountries')}</span>}
              </p>
            </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {field.type === 'checkbox' ? t('checkboxText') : t('placeholderText')}
                </label>
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => onUpdate(field.id, { placeholder: e.target.value || undefined })}
                  placeholder={
                    field.type === 'checkbox'
                      ? "I accept [Terms of Service](https://example.com/terms)"
                      : t('placeholderEnterPlaceholder')
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {field.type === 'checkbox' && (
                  <p className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="font-semibold text-blue-900">💡 {t('tipAddClickableLinks')}</span><br />
                    <code className="text-blue-800 bg-white px-2 py-1 rounded mt-1 inline-block text-xs">
                      I accept [Terms](https://example.com/terms) and [Privacy Policy](https://example.com/privacy)
                    </code>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('descriptionHelpText')}
                </label>
                <textarea
                  value={field.description || ''}
                  onChange={(e) => onUpdate(field.id, { description: e.target.value || undefined })}
                  placeholder={t('helpTextShownBelow')}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* File Upload Options */}
              {field.type === 'file' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm font-semibold text-green-900">{t('fileUploadSettings')}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('allowedFileTypes')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'].map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.fileTypes?.includes(type) || false}
                            onChange={(e) => {
                              const current = field.fileTypes || ['.pdf', '.doc', '.docx']
                              const updated = e.target.checked
                                ? [...current, type]
                                : current.filter(t => t !== type)
                              onUpdate(field.id, { fileTypes: updated })
                            }}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('maxFileSizeMb')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={field.maxFileSize || 10}
                      onChange={(e) => onUpdate(field.id, { maxFileSize: parseInt(e.target.value) || 10 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('maximum50Mb')}</p>
                  </div>
                </div>
              )}

              {/* Long Text Options */}
              {field.type === 'longtext' && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm font-semibold text-purple-900">{t('longTextSettings')}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('maximumCharacters')}
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      step="1"
                      value={field.validation?.maxLength ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          // Allow empty field during typing
                          onUpdate(field.id, { 
                            validation: { 
                              ...field.validation, 
                              maxLength: undefined as any
                            } 
                          })
                        } else {
                          const numValue = parseInt(value)
                          if (!isNaN(numValue)) {
                            onUpdate(field.id, { 
                              validation: { 
                                ...field.validation, 
                                maxLength: numValue
                              } 
                            })
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Validate and set defaults on blur
                        const value = parseInt(e.target.value)
                        if (isNaN(value) || value < 100) {
                          onUpdate(field.id, { 
                            validation: { 
                              ...field.validation, 
                              maxLength: 5000
                            } 
                          })
                        } else if (value > 5000) {
                          onUpdate(field.id, { 
                            validation: { 
                              ...field.validation, 
                              maxLength: 5000
                            } 
                          })
                        }
                      }}
                      placeholder={t('placeholderMaxCharacters')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('usersCanPasteUpTo', {
                        max: field.validation?.maxLength || 5000,
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('minimumCharactersOptional')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={field.validation?.maxLength || 5000}
                      step="1"
                      value={field.validation?.minLength || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          onUpdate(field.id, { 
                            validation: { 
                              ...field.validation, 
                              minLength: undefined
                            } 
                          })
                        } else {
                          const numValue = Math.max(0, parseInt(value) || 0)
                          onUpdate(field.id, { 
                            validation: { 
                              ...field.validation, 
                              minLength: numValue
                            } 
                          })
                        }
                      }}
                      placeholder={t('placeholderNoMinimum')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('leaveEmptyNoMinimum')}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
