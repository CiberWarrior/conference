'use client'

import { useState } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'
import type { CustomRegistrationField } from '@/types/conference'

interface FieldEditorProps {
  field: CustomRegistrationField
  onSave: (field: CustomRegistrationField) => void
  onCancel: () => void
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text (Short answer)' },
  { value: 'textarea', label: 'Textarea (Long answer)' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone Number' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown (Select one)' },
  { value: 'radio', label: 'Radio Buttons (Yes/No or multiple choice)' },
  { value: 'checkbox', label: 'Checkbox (Single agreement)' },
] as const

export default function FieldEditor({
  field,
  onSave,
  onCancel,
}: FieldEditorProps) {
  const [editedField, setEditedField] = useState<CustomRegistrationField>(field)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSave = () => {
    // Validation
    const newErrors: Record<string, string> = {}

    if (!editedField.name.trim()) {
      newErrors.name = 'Field name is required'
    } else if (!/^[a-z][a-z0-9_]*$/i.test(editedField.name)) {
      newErrors.name = 'Field name must start with a letter and contain only letters, numbers, and underscores'
    }

    if (!editedField.label.trim()) {
      newErrors.label = 'Label is required'
    }

    if ((editedField.type === 'select' || editedField.type === 'radio') && (!editedField.options || editedField.options.length === 0)) {
      newErrors.options = `${editedField.type === 'radio' ? 'Radio button' : 'Select'} field must have at least one option`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSave(editedField)
  }

  const updateField = (key: keyof CustomRegistrationField, value: any) => {
    setEditedField((prev) => ({ ...prev, [key]: value }))
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[key]
      return newErrors
    })
  }

  const updateValidation = (key: string, value: any) => {
    setEditedField((prev) => ({
      ...prev,
      validation: { ...prev.validation, [key]: value },
    }))
  }

  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Edit Field</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Field Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Field Name (Internal) *
          </label>
          <input
            type="text"
            value={editedField.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., dietary_requirements"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Field Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Field Type *
          </label>
          <select
            value={editedField.type}
            onChange={(e) => updateField('type', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FIELD_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Label (Displayed to users) *
          </label>
          <input
            type="text"
            value={editedField.label}
            onChange={(e) => updateField('label', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.label ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Dietary Requirements"
          />
          {errors.label && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.label}
            </p>
          )}
        </div>

        {/* Placeholder */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {editedField.type === 'checkbox' ? 'Checkbox Text' : 'Placeholder'}
          </label>
          <input
            type="text"
            value={editedField.placeholder || ''}
            onChange={(e) => updateField('placeholder', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={
              editedField.type === 'checkbox' 
                ? "I accept [Terms of Service](https://example.com/terms)" 
                : "e.g., Enter your dietary requirements"
            }
          />
          {editedField.type === 'checkbox' && (
            <p className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="font-semibold text-blue-900">💡 Tip:</span> Add clickable links using markdown syntax:<br />
              <code className="text-blue-800 bg-white px-2 py-1 rounded mt-1 inline-block">
                I accept [Terms](https://example.com/terms) and [Privacy Policy](https://example.com/privacy)
              </code>
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description (Help text)
          </label>
          <input
            type="text"
            value={editedField.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional information for users"
          />
        </div>

        {/* Options for Select and Radio */}
        {(editedField.type === 'select' || editedField.type === 'radio') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Options (one per line) *
            </label>
            <textarea
              value={(editedField.options || []).join('\n')}
              onChange={(e) =>
                updateField(
                  'options',
                  e.target.value.split('\n').filter((opt) => opt.trim())
                )
              }
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.options ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={4}
              placeholder={editedField.type === 'radio' ? "Yes&#10;No" : "Option 1&#10;Option 2&#10;Option 3"}
            />
            {errors.options && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.options}
              </p>
            )}
            {editedField.type === 'radio' && (
              <p className="mt-2 text-xs text-gray-500">
                For Yes/No questions, enter: Yes and No (one per line)
              </p>
            )}
          </div>
        )}

        {/* Required */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="required"
            checked={editedField.required}
            onChange={(e) => updateField('required', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="required" className="ml-2 text-sm font-medium text-gray-700">
            Required field
          </label>
        </div>

        {/* Validation for text fields */}
        {(editedField.type === 'text' || editedField.type === 'textarea') && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Validation (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Length</label>
                <input
                  type="number"
                  value={editedField.validation?.minLength || ''}
                  onChange={(e) => updateValidation('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Length</label>
                <input
                  type="number"
                  value={editedField.validation?.maxLength || ''}
                  onChange={(e) => updateValidation('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="No limit"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Validation for number fields */}
        {editedField.type === 'number' && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Validation (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Value</label>
                <input
                  type="number"
                  value={editedField.validation?.min || ''}
                  onChange={(e) => updateValidation('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="No minimum"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Value</label>
                <input
                  type="number"
                  value={editedField.validation?.max || ''}
                  onChange={(e) => updateValidation('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="No maximum"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
