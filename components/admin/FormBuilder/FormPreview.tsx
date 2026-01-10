'use client'

import type { CustomRegistrationField } from '@/types/conference'
import { AlertCircle } from 'lucide-react'

interface FormPreviewProps {
  fields: CustomRegistrationField[]
}

export default function FormPreview({ fields }: FormPreviewProps) {
  if (fields.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">Preview will appear here once you add custom fields.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Registration Form Preview</h3>
        <p className="text-sm text-gray-500 mt-1">
          This is how custom fields will appear to users
        </p>
      </div>

      <div className="space-y-6">
        {/* Standard fields preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Standard fields (First Name, Last Name, Email, etc.) will appear above custom fields
          </p>
        </div>

        {/* Custom fields preview */}
        <div className="border-t pt-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Additional Information</h4>
          
          {fields.map((field) => (
            <div key={field.id} className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.description && (
                <p className="text-xs text-gray-500 mb-2">{field.description}</p>
              )}

              {/* Text input */}
              {field.type === 'text' && (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              )}

              {/* Textarea */}
              {field.type === 'textarea' && (
                <textarea
                  placeholder={field.placeholder}
                  disabled
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              )}

              {/* Email */}
              {field.type === 'email' && (
                <input
                  type="email"
                  placeholder={field.placeholder}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              )}

              {/* Phone */}
              {field.type === 'tel' && (
                <input
                  type="tel"
                  placeholder={field.placeholder}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              )}

              {/* Number */}
              {field.type === 'number' && (
                <input
                  type="number"
                  placeholder={field.placeholder}
                  disabled
                  min={field.validation?.min}
                  max={field.validation?.max}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              )}

              {/* Date */}
              {field.type === 'date' && (
                <input
                  type="date"
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              )}

              {/* Select */}
              {field.type === 'select' && (
                <select
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option, idx) => (
                    <option key={idx} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {/* Checkbox */}
              {field.type === 'checkbox' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    disabled
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">{field.placeholder || 'Check this box'}</span>
                </div>
              )}

              {/* Validation hints */}
              {(field.validation?.minLength || field.validation?.maxLength) && (
                <p className="text-xs text-gray-500 mt-1">
                  {field.validation.minLength && `Min ${field.validation.minLength} characters`}
                  {field.validation.minLength && field.validation.maxLength && ' • '}
                  {field.validation.maxLength && `Max ${field.validation.maxLength} characters`}
                </p>
              )}
              {(field.validation?.min !== undefined || field.validation?.max !== undefined) && (
                <p className="text-xs text-gray-500 mt-1">
                  {field.validation.min !== undefined && `Min: ${field.validation.min}`}
                  {field.validation.min !== undefined && field.validation.max !== undefined && ' • '}
                  {field.validation.max !== undefined && `Max: ${field.validation.max}`}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
