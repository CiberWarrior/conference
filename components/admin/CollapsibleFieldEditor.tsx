'use client'

import { useState } from 'react'
import { X, Globe, GripVertical } from 'lucide-react'
import type { CustomRegistrationField } from '@/types/conference'

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
              {field.label || 'Untitled Field'}
            </span>
          </div>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {field.type === 'text' && 'Text'}
            {field.type === 'textarea' && 'Textarea'}
            {field.type === 'email' && 'Email'}
            {field.type === 'tel' && 'Phone'}
            {field.type === 'number' && 'Number'}
            {field.type === 'date' && 'Date'}
            {field.type === 'select' && 'Dropdown'}
            {field.type === 'radio' && 'Radio'}
            {field.type === 'checkbox' && 'Checkbox'}
            {field.type === 'separator' && 'Separator'}
          </span>
          {field.required && field.type !== 'separator' && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Required</span>
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
            title="Remove field"
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
          {field.type === 'separator' ? (
            // Separator-specific fields (simplified)
            <>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-sm font-semibold text-purple-900">Section Separator</span>
                </div>
                <p className="text-xs text-purple-700">
                  This field creates a visual separator in the form. Use it to group fields for different authors or sections.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Field Name (Internal) *
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => onUpdate(field.id, { name: e.target.value })}
                    placeholder="e.g., author_2_separator"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Used internally (lowercase, underscores)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section Title (Display) *
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                    placeholder="e.g., Author 2, Additional Authors"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Title shown as section header in the form</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description / Help Text (Optional)
                </label>
                <textarea
                  value={field.description || ''}
                  onChange={(e) => onUpdate(field.id, { description: e.target.value || undefined })}
                  placeholder="Optional description shown below the section title"
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
                    Field Name (Internal) *
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => onUpdate(field.id, { name: e.target.value })}
                    placeholder="Enter field name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Used internally (lowercase, underscores)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Field Label (Display) *
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                    placeholder="Field name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Shown to users in the form</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Field Type *
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      onUpdate(field.id, {
                        type: e.target.value as CustomRegistrationField['type'],
                        options: (e.target.value === 'select' || e.target.value === 'radio') ? [] : undefined,
                        required: e.target.value === 'separator' ? false : field.required,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text (Short Answer)</option>
                    <option value="textarea">Textarea (Long Answer)</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone Number</option>
                    <option value="date">Date</option>
                    <option value="select">Dropdown (Select)</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="separator">Separator (Section Break)</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer pt-8">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
                      disabled={field.type === 'separator'}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-semibold text-gray-700">Required Field</span>
                  </label>
                  {field.type === 'separator' && (
                    <p className="text-xs text-gray-500 mt-1">Separators are never required</p>
                  )}
                </div>
              </div>

              {(field.type === 'select' || field.type === 'radio') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Options (one per line) *
                </label>
                {field.type === 'select' && (
                  <button
                    type="button"
                    onClick={() => onUpdate(field.id, { options: WORLD_COUNTRIES })}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    <Globe className="w-3 h-3" />
                    Load All Countries
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
                placeholder={field.type === 'radio' ? "Bank transfer&#10;Credit/debit card" : "Option 1&#10;Option 2&#10;Option 3"}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter each option on a new line
                {field.type === 'select' && <span className="font-semibold"> • Or click "Load All Countries" for country dropdown</span>}
              </p>
            </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {field.type === 'checkbox' ? 'Checkbox Text' : 'Placeholder Text'}
                </label>
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => onUpdate(field.id, { placeholder: e.target.value || undefined })}
                  placeholder={
                    field.type === 'checkbox'
                      ? "I accept [Terms of Service](https://example.com/terms)"
                      : "Enter placeholder text"
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {field.type === 'checkbox' && (
                  <p className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="font-semibold text-blue-900">💡 Tip:</span> Add clickable links using markdown syntax:<br />
                    <code className="text-blue-800 bg-white px-2 py-1 rounded mt-1 inline-block text-xs">
                      I accept [Terms](https://example.com/terms) and [Privacy Policy](https://example.com/privacy)
                    </code>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description / Help Text
                </label>
                <textarea
                  value={field.description || ''}
                  onChange={(e) => onUpdate(field.id, { description: e.target.value || undefined })}
                  placeholder="Help text shown below the field (optional)"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
