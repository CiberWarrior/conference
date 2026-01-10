'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import type { CustomRegistrationField } from '@/types/conference'
import FieldEditor from './FieldEditor'

interface AddFieldModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (field: CustomRegistrationField) => void
}

export default function AddFieldModal({ isOpen, onClose, onAdd }: AddFieldModalProps) {
  const [newField, setNewField] = useState<CustomRegistrationField>({
    id: '',
    name: '',
    type: 'text',
    label: '',
    placeholder: '',
    description: '',
    required: false,
  })

  if (!isOpen) return null

  const handleSave = (field: CustomRegistrationField) => {
    // Generate ID if not present
    const fieldWithId = {
      ...field,
      id: field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    onAdd(fieldWithId)
    // Reset form
    setNewField({
      id: '',
      name: '',
      type: 'text',
      label: '',
      placeholder: '',
      description: '',
      required: false,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-600" />
              Add Custom Field
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <FieldEditor
              field={newField}
              onSave={handleSave}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
