'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { CustomRegistrationField } from '@/types/conference'

interface AddFieldModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (fieldType: CustomRegistrationField['type']) => void
}

const FIELD_TYPES = [
  {
    value: 'text' as const,
    label: 'Text (Short Answer)',
    description: 'Single line text input',
    icon: '📝',
    example: 'First Name, Organization, etc.',
  },
  {
    value: 'textarea' as const,
    label: 'Textarea (Long Answer)',
    description: 'Multi-line text input',
    icon: '📄',
    example: 'Comments, Special Requests, etc.',
  },
  {
    value: 'email' as const,
    label: 'Email',
    description: 'Email address with validation',
    icon: '📧',
    example: 'Email Address',
  },
  {
    value: 'tel' as const,
    label: 'Phone Number',
    description: 'Phone number input',
    icon: '📱',
    example: 'Contact Number',
  },
  {
    value: 'number' as const,
    label: 'Number',
    description: 'Numeric input',
    icon: '🔢',
    example: 'Age, Quantity, etc.',
  },
  {
    value: 'date' as const,
    label: 'Date',
    description: 'Date picker',
    icon: '📅',
    example: 'Arrival Date, Birth Date, etc.',
  },
  {
    value: 'select' as const,
    label: 'Dropdown (Select)',
    description: 'Select one option from a list',
    icon: '📋',
    example: 'Country, Status, etc.',
  },
  {
    value: 'radio' as const,
    label: 'Radio Buttons',
    description: 'Choose one from multiple options',
    icon: '🔘',
    example: 'Payment Method, Yes/No, etc.',
  },
  {
    value: 'checkbox' as const,
    label: 'Checkbox',
    description: 'Single checkbox (agreement)',
    icon: '✅',
    example: 'I accept Terms of Service',
  },
]

export default function AddFieldModal({ isOpen, onClose, onAdd }: AddFieldModalProps) {
  const [selectedType, setSelectedType] = useState<CustomRegistrationField['type'] | null>(null)

  if (!isOpen) return null

  const handleAdd = () => {
    if (selectedType) {
      onAdd(selectedType)
      setSelectedType(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Custom Field</h2>
            <p className="text-sm text-gray-600 mt-1">Select the type of field you want to add</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Field Types Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FIELD_TYPES.map((fieldType) => (
              <button
                key={fieldType.value}
                onClick={() => setSelectedType(fieldType.value)}
                className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                  selectedType === fieldType.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0">{fieldType.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1">{fieldType.label}</h3>
                    <p className="text-xs text-gray-600 mb-2">{fieldType.description}</p>
                    <p className="text-xs text-blue-600 font-medium">
                      Example: {fieldType.example}
                    </p>
                  </div>
                  {selectedType === fieldType.value && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedType ? (
              <>
                Selected: <span className="font-semibold text-gray-900">
                  {FIELD_TYPES.find(ft => ft.value === selectedType)?.label}
                </span>
              </>
            ) : (
              'Please select a field type'
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedType}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Field
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
