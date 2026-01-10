'use client'

import { Edit, Trash2, GripVertical } from 'lucide-react'
import type { CustomRegistrationField } from '@/types/conference'

interface FieldListProps {
  fields: CustomRegistrationField[]
  onEdit: (field: CustomRegistrationField) => void
  onDelete: (fieldId: string) => void
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  textarea: 'Textarea',
  email: 'Email',
  tel: 'Phone',
  number: 'Number',
  date: 'Date',
  select: 'Select',
  checkbox: 'Checkbox',
}

export default function FieldList({ fields, onEdit, onDelete }: FieldListProps) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No custom fields yet. Add your first field to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div
          key={field.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            {/* Drag Handle */}
            <div className="text-gray-400 cursor-move">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Field Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-semibold text-gray-900">{field.label}</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {FIELD_TYPE_LABELS[field.type] || field.type}
                </span>
                {field.required && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Field name: <code className="bg-gray-100 px-1 rounded">{field.name}</code>
              </p>
              {field.description && (
                <p className="text-sm text-gray-600 mt-1">{field.description}</p>
              )}
              {field.type === 'select' && field.options && field.options.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Options: {field.options.join(', ')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(field)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit field"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete the field "${field.label}"?`)) {
                    onDelete(field.id)
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete field"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
