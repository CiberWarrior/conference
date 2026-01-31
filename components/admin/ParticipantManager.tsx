'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Users } from 'lucide-react'
import type { Participant } from '@/types/participant'
import type { CustomRegistrationField } from '@/types/conference'
import { getTranslatedFieldLabelKey } from '@/lib/registration-field-labels'

interface ParticipantManagerProps {
  participants: Participant[]
  onChange: (participants: Participant[]) => void
  maxParticipants: number
  participantFields: string[]
  customFields?: CustomRegistrationField[]
  participantLabel?: string
  customFieldsPerParticipant?: boolean
}

export default function ParticipantManager({
  participants,
  onChange,
  maxParticipants,
  participantFields,
  customFields = [],
  participantLabel = 'Participant',
  customFieldsPerParticipant = true,
}: ParticipantManagerProps) {
  const t = useTranslations('registrationForm')
  const tFieldLabels = useTranslations('admin.conferences')
  const [expandedParticipant, setExpandedParticipant] = useState<number>(0)

  const addParticipant = () => {
    if (participants.length >= maxParticipants) {
      alert(t('maxParticipantsAllowed', { max: maxParticipants }))
      return
    }

    const newParticipant: Participant = {
      customFields: {},
    }

    onChange([...participants, newParticipant])
    setExpandedParticipant(participants.length)
  }

  const removeParticipant = (index: number) => {
    if (participants.length <= 1) {
      alert(`At least one ${participantLabel.toLowerCase()} is required`)
      return
    }

    const updated = participants.filter((_, i) => i !== index)
    onChange(updated)
    if (expandedParticipant === index) {
      setExpandedParticipant(0)
    }
  }

  const updateParticipant = (index: number, fieldName: string, value: any) => {
    const updated = [...participants]
    updated[index] = {
      ...updated[index],
      customFields: {
        ...updated[index].customFields,
        [fieldName]: value,
      },
    }
    onChange(updated)
  }

  // Helper function to parse markdown links in checkbox labels
  const parseMarkdownToHtml = (text: string): string => {
    return text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>'
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {participantLabel}s ({participants.length}/{maxParticipants})
          </h3>
        </div>
        {participants.length < maxParticipants && (
          <button
            type="button"
            onClick={addParticipant}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('addParticipant', { label: participantLabel })}
          </button>
        )}
      </div>

      {/* Participants List */}
      <div className="space-y-3">
        {participants.map((participant, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            {/* Participant Header */}
            <div
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() =>
                setExpandedParticipant(expandedParticipant === index ? -1 : index)
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      const firstName = participant.customFields?.['first_name'] || participant.customFields?.['firstName'] || ''
                      const lastName = participant.customFields?.['last_name'] || participant.customFields?.['lastName'] || ''
                      const fullName = `${firstName} ${lastName}`.trim()
                      return fullName || `${participantLabel} ${index + 1}`
                    })()}
                  </p>
                  {(() => {
                    const email = participant.customFields?.['email'] || participant.customFields?.['Email'] || ''
                    return email ? <p className="text-sm text-gray-500">{email}</p> : null
                  })()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {participants.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeParticipant(index)
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove participant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedParticipant === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Participant Fields (Expanded) */}
            {expandedParticipant === index && (
              <div className="p-4 space-y-4">
                {/* All Custom Fields */}
                {customFields.length > 0 ? (
                  <div className="space-y-4">
                    {customFields.map((field) => {
                      const fieldValue = participant.customFields?.[field.name] || ''
                      const labelKey = getTranslatedFieldLabelKey(field.name, field.label)
                      const displayLabel = labelKey ? tFieldLabels(labelKey) : (field.label || '')
                      return (
                        <div key={field.id}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {displayLabel}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {field.description && (
                            <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                          )}

                          {/* Text Input */}
                          {field.type === 'text' && (
                            <input
                              type="text"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                updateParticipant(index, field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}

                          {/* Textarea */}
                          {field.type === 'textarea' && (
                            <textarea
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                updateParticipant(index, field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              rows={4}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}

                          {/* Email */}
                          {field.type === 'email' && (
                            <input
                              type="email"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                updateParticipant(index, field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}

                          {/* Phone */}
                          {field.type === 'tel' && (
                            <input
                              type="tel"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                updateParticipant(index, field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}

                          {/* Number */}
                          {field.type === 'number' && (
                            <input
                              type="number"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                updateParticipant(index, field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              min={field.validation?.min}
                              max={field.validation?.max}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}

                          {/* Date */}
                          {field.type === 'date' && (
                            <input
                              type="date"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                updateParticipant(index, field.name, e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}

                          {/* Select Dropdown */}
                          {field.type === 'select' && field.options && (
                            <select
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                updateParticipant(index, field.name, e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">{t('selectPlaceholder')}</option>
                              {field.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Radio Buttons */}
                          {field.type === 'radio' && field.options && (
                            <div className="space-y-2">
                              {field.options.map((option) => (
                                <div key={option} className="flex items-center">
                                  <input
                                    type="radio"
                                    id={`${field.name}-${index}-${option}`}
                                    name={`${field.name}-${index}`}
                                    value={option}
                                    checked={fieldValue === option}
                                    onChange={(e) =>
                                      updateParticipant(index, field.name, e.target.value)
                                    }
                                    required={field.required}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`${field.name}-${index}-${option}`}
                                    className="ml-2 text-sm text-gray-700"
                                  >
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Checkbox */}
                          {field.type === 'checkbox' && (
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id={`${field.name}-${index}`}
                                checked={fieldValue === true || fieldValue === 'true'}
                                onChange={(e) =>
                                  updateParticipant(index, field.name, e.target.checked)
                                }
                                required={field.required}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
                              />
                              <label 
                                htmlFor={`${field.name}-${index}`}
                                className="text-sm text-gray-700 cursor-pointer"
                                dangerouslySetInnerHTML={{ 
                                  __html: parseMarkdownToHtml(field.placeholder || displayLabel)
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t('noFieldsConfiguredParticipant')}</p>
                    <p className="text-sm mt-1">{t('addCustomFieldsInSettings')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
