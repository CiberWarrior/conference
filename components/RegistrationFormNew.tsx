'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import LoadingSpinner from './LoadingSpinner'
import { showSuccess, showError } from '@/utils/toast'
import type { CustomRegistrationField, ParticipantSettings } from '@/types/conference'
import type { Participant } from '@/types/participant'
import ParticipantManager from '@/components/admin/ParticipantManager'
import { AlertCircle } from 'lucide-react'

// Helper function to create dynamic schema based on custom fields only
const createRegistrationSchema = (customFields: CustomRegistrationField[] = []) => {
  // No base/standard fields - all fields are custom and defined by admin
  const baseSchema = z.object({
    customFields: z.record(z.any()).optional(),
  })

  // Add custom fields to schema
  const customFieldsSchema: Record<string, z.ZodTypeAny> = {}
  customFields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny

    switch (field.type) {
      case 'text':
      case 'textarea':
        fieldSchema = z.string()
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`)
        }
        if (field.validation?.minLength) {
          fieldSchema = fieldSchema.min(field.validation.minLength, `Minimum ${field.validation.minLength} characters`)
        }
        if (field.validation?.maxLength) {
          fieldSchema = fieldSchema.max(field.validation.maxLength, `Maximum ${field.validation.maxLength} characters`)
        }
        break
      case 'email':
        fieldSchema = z.string().email('Invalid email address')
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`)
        }
        break
      case 'tel':
        fieldSchema = z.string()
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`)
        }
        break
      case 'number':
        fieldSchema = z.number().or(z.string().transform((val) => parseFloat(val) || 0))
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min, `Minimum value is ${field.validation.min}`)
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max, `Maximum value is ${field.validation.max}`)
        }
        if (!field.required) {
          fieldSchema = fieldSchema.optional()
        }
        break
      case 'date':
        fieldSchema = z.string()
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`)
        }
        break
      case 'select':
        fieldSchema = z.string()
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`)
        }
        break
      case 'checkbox':
        fieldSchema = z.boolean()
        if (field.required) {
          fieldSchema = fieldSchema.refine((val) => val === true, `${field.label} is required`)
        }
        break
      default:
        fieldSchema = z.string().optional()
    }

    if (!field.required && field.type !== 'checkbox' && field.type !== 'number') {
      fieldSchema = fieldSchema.optional()
    }

    customFieldsSchema[`customFields.${field.name}`] = fieldSchema
  })

  const schemaWithCustom = baseSchema.extend(customFieldsSchema)

  return schemaWithCustom
}

interface RegistrationFormProps {
  conferenceId?: string
  customFields?: CustomRegistrationField[] // Custom registration fields from conference settings
  participantSettings?: ParticipantSettings // Settings for multiple participants
  registrationInfoText?: string // Informational text to display at the top of the form
}

export default function RegistrationForm({
  conferenceId,
  customFields = [],
  participantSettings,
  registrationInfoText,
}: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  // Multiple participants state
  const [participants, setParticipants] = useState<Participant[]>([
    {
      firstName: '',
      lastName: '',
      email: '',
      customFields: {},
    },
  ])

  // Create dynamic schema based on custom fields
  const registrationSchema = createRegistrationSchema(customFields)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      customFields: {},
    },
  })

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)

      // Collect participants data if enabled
      const participantsData = participantSettings?.enabled ? participants : []

      const payload = {
        conference_id: conferenceId,
        custom_data: data.customFields || {},
        participants: participantsData,
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      setSubmitSuccess(true)
      showSuccess('Registration submitted successfully!')
    } catch (error: any) {
      console.error('Registration error:', error)
      showError(error.message || 'Failed to submit registration')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 md:p-10 rounded-xl shadow-xl border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600">Thank you for registering. You will receive a confirmation email shortly.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-4xl mx-auto animate-fade-in"
    >
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
        {/* Registration Information Text */}
        {registrationInfoText && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Registration Information</h3>
                <div className="text-sm text-blue-800 whitespace-pre-line">
                  {registrationInfoText}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Multiple Participants Section - Only shown if enabled in conference settings */}
          {participantSettings?.enabled && (
            <div className="animate-slide-in">
              <ParticipantManager
                participants={participants}
                onChange={setParticipants}
                settings={participantSettings}
                customFields={customFields}
              />
            </div>
          )}

          {/* Custom Registration Fields */}
          {customFields.length > 0 && (
            <div className="space-y-6">
              <div className="border-t border-gray-200 pt-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Registration Fields</h3>
                <p className="text-sm text-gray-600 mt-1">Please fill in all required fields</p>
              </div>
              {customFields.map((field) => {
                const fieldName = `customFields.${field.name}`
                const fieldError = (errors as any).customFields?.[field.name]

                return (
                  <div key={field.id} className="animate-slide-in">
                    <label
                      htmlFor={fieldName}
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input
                        {...register(fieldName as any)}
                        type="text"
                        id={fieldName}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        {...register(fieldName as any)}
                        id={fieldName}
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'email' && (
                      <input
                        {...register(fieldName as any)}
                        type="email"
                        id={fieldName}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'tel' && (
                      <input
                        {...register(fieldName as any)}
                        type="tel"
                        id={fieldName}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        {...register(fieldName as any, { valueAsNumber: true })}
                        type="number"
                        id={fieldName}
                        placeholder={field.placeholder}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'date' && (
                      <input
                        {...register(fieldName as any)}
                        type="date"
                        id={fieldName}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'select' && field.options && (
                      <select
                        {...register(fieldName as any)}
                        id={fieldName}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select...</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="flex items-center">
                        <input
                          {...register(fieldName as any)}
                          type="checkbox"
                          id={fieldName}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={fieldName} className="ml-2 text-sm text-gray-600">
                          {field.placeholder || field.label}
                        </label>
                      </div>
                    )}

                    {fieldError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {fieldError.message}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state when no fields */}
          {customFields.length === 0 && !participantSettings?.enabled && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No registration fields configured yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Please contact the conference administrator.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        {(customFields.length > 0 || participantSettings?.enabled) && (
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Submitting...
                </span>
              ) : (
                'Submit Registration'
              )}
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
