'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react'
import type { Conference, CustomRegistrationField } from '@/types/conference'
import { showSuccess, showError } from '@/utils/toast'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function SubmitAbstractPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Form state
  const [file, setFile] = useState<File | null>(null)
  const [customFields, setCustomFields] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!slug) return

    const loadConference = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/conferences/${slug}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Conference not found')
          return
        }

        const conf = data.conference
        
        // Ensure settings is an object, not a string (handle JSONB parsing)
        if (conf.settings && typeof conf.settings === 'string') {
          try {
            conf.settings = JSON.parse(conf.settings)
          } catch (err) {
            console.error('Failed to parse settings JSON:', err)
            conf.settings = {}
          }
        }
        
        // Ensure custom_abstract_fields is an array
        if (conf.settings && !Array.isArray(conf.settings.custom_abstract_fields)) {
          conf.settings.custom_abstract_fields = []
        }
        
        
        setConference(conf)


        // Check if abstract submission is enabled
        const settings = conf.settings || {}
        if (settings.abstract_submission_enabled === false) {
          setError('Abstract submission is not available for this conference')
          return
        }
      } catch (err) {
        setError('Failed to load conference')
        console.error('Error loading conference:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConference()
  }, [slug])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf',
      ]
      const allowedExtensions = ['.doc', '.docx', '.pdf']
      const fileExtension = selectedFile.name
        .toLowerCase()
        .substring(selectedFile.name.lastIndexOf('.'))

      const isValidType =
        allowedTypes.includes(selectedFile.type) ||
        allowedExtensions.includes(fileExtension)

      if (!isValidType) {
        showError('Only Word documents (.doc, .docx) and PDF files are allowed')
        return
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (selectedFile.size > maxSize) {
        showError(
          `File size must be less than 10MB. Current size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`
        )
        return
      }

      setFile(selectedFile)
    }
  }

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setCustomFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      showError('Please select a file to upload')
      return
    }

    // Validate required custom fields (skip separators)
    const abstractCustomFields = Array.isArray(conference?.settings?.custom_abstract_fields)
      ? conference.settings.custom_abstract_fields
      : []

    // Check if email is in custom fields
    const emailField = abstractCustomFields.find((f) => f && f.type === 'email')
    const email = emailField ? customFields[emailField.name] : null
    
    if (!email) {
      showError('Email is required. Please fill in the email field.')
      return
    }
    for (const field of abstractCustomFields) {
      if (field && field.type !== 'separator' && field.required && !customFields[field.name]) {
        showError(`Please fill in the required field: ${field.label}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('email', email)
      // Append custom_data as JSON
      formData.append('custom_data', JSON.stringify(customFields))

      const response = await fetch(`/api/conferences/${slug}/submit-abstract`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data.error || data.details || 'Failed to submit abstract')
        return
      }

      setSubmitSuccess(true)
      showSuccess('Abstract submitted successfully!')

      // Reset form
      setFile(null)
      setCustomFields({})
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err) {
      console.error('Error submitting abstract:', err)
      showError('Failed to submit abstract. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !conference) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Conference not found'}
            </h1>
            <Link
              href={slug ? `/conferences/${slug}` : '/'}
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/conferences/${slug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Conference
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-xl"
              style={
                conference.primary_color
                  ? {
                      background: `linear-gradient(135deg, ${conference.primary_color} 0%, ${conference.primary_color}DD 100%)`,
                    }
                  : {
                      background:
                        'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
                    }
              }
            >
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Abstract Submission
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Share your research with the scientific community. Upload your
              abstract or paper to be considered for presentation at{' '}
              {conference.name}.
            </p>
          </div>

          {/* Conference Info */}
          {(conference.start_date || conference.location) && (
            <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {conference.start_date && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Date</div>
                      <div className="text-gray-600">
                        {new Date(
                          conference.start_date
                        ).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {conference.end_date &&
                          ` - ${new Date(
                            conference.end_date
                          ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}`}
                      </div>
                    </div>
                  </div>
                )}
                {conference.location && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Location</div>
                      <div className="text-gray-600">
                        {conference.location}
                        {conference.venue && `, ${conference.venue}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Word or PDF format (.doc, .docx, .pdf)
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Quick upload process
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Instant confirmation
              </span>
            </div>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Abstract Submitted Successfully!
                  </h3>
                  <p className="text-green-700">
                    Thank you for submitting your abstract. We have received your
                    submission and will review it shortly. You will receive a
                    confirmation email at {email}.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="text-green-600 hover:text-green-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Abstract Upload Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Custom Fields */}
              {conference.settings?.custom_abstract_fields &&
                Array.isArray(conference.settings.custom_abstract_fields) &&
                conference.settings.custom_abstract_fields.length > 0 && (
                  <div className="space-y-6">
                    {conference.settings.custom_abstract_fields
                      .filter((field) => field && field.name && field.type) // Filter out invalid fields
                      .map((field, idx) => {
                      const fieldValue = customFields[field.name] || ''
                      

                      // Render separator
                      if (field.type === 'separator') {
                        return (
                          <div key={`separator-${field.id}-${idx}`} className="my-8 pt-4 border-t-2 border-purple-200">
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-purple-300"></div>
                              </div>
                              <div className="relative flex justify-center">
                                <div className="bg-white px-4 py-2">
                                  <h4 className="text-lg font-bold text-gray-900">
                                    {field.label}
                                  </h4>
                                  {field.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {field.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={`field-${field.id}-${idx}`} className="field-wrapper">
                          <label
                            htmlFor={`custom-${field.name}`}
                            className="block text-sm font-semibold text-gray-900 mb-2"
                          >
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          {field.description && (
                            <p className="text-xs text-gray-500 mb-2">
                              {field.description}
                            </p>
                          )}

                          {/* Textarea - must come before text to avoid conflicts */}
                          {field.type === 'textarea' && (
                            <textarea
                              id={`custom-${field.name}`}
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                handleCustomFieldChange(field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              rows={4}
                              disabled={isSubmitting}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y min-h-[100px]"
                            />
                          )}

                          {/* Text Input */}
                          {field.type === 'text' && (
                            <input
                              id={`custom-${field.name}`}
                              type="text"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                handleCustomFieldChange(field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              disabled={isSubmitting}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                          )}

                          {/* Email */}
                          {field.type === 'email' && (
                            <input
                              id={`custom-${field.name}`}
                              type="email"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                handleCustomFieldChange(field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              disabled={isSubmitting}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                          )}

                          {/* Phone */}
                          {field.type === 'tel' && (
                            <input
                              id={`custom-${field.name}`}
                              type="tel"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                handleCustomFieldChange(field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              disabled={isSubmitting}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                          )}

                          {/* Number */}
                          {field.type === 'number' && (
                            <input
                              id={`custom-${field.name}`}
                              type="number"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                handleCustomFieldChange(field.name, e.target.value)
                              }
                              placeholder={field.placeholder}
                              min={field.validation?.min}
                              max={field.validation?.max}
                              disabled={isSubmitting}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                          )}

                          {/* Date */}
                          {field.type === 'date' && (
                            <input
                              id={`custom-${field.name}`}
                              type="date"
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                handleCustomFieldChange(field.name, e.target.value)
                              }
                              disabled={isSubmitting}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                          )}

                          {/* Select Dropdown */}
                          {field.type === 'select' && field.options && (
                            <select
                              id={`custom-${field.name}`}
                              required={field.required}
                              value={fieldValue}
                              onChange={(e) =>
                                handleCustomFieldChange(field.name, e.target.value)
                              }
                              disabled={isSubmitting}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="">Select...</option>
                              {field.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Radio Buttons */}
                          {field.type === 'radio' && (
                            <>
                              {field.options && Array.isArray(field.options) && field.options.length > 0 ? (
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                  {field.options.map((option, optIdx) => (
                                    <div key={`${field.name}-${optIdx}-${option}`} className="flex items-center">
                                      <input
                                        type="radio"
                                        id={`custom-${field.name}-${optIdx}-${option}`}
                                        name={`custom-${field.name}`}
                                        value={option}
                                        checked={fieldValue === option}
                                        onChange={(e) =>
                                          handleCustomFieldChange(
                                            field.name,
                                            e.target.value
                                          )
                                        }
                                        required={field.required}
                                        disabled={isSubmitting}
                                        className="w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500 focus:ring-2 cursor-pointer"
                                      />
                                      <label
                                        htmlFor={`custom-${field.name}-${optIdx}-${option}`}
                                        className="ml-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                                      >
                                        {option}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-sm text-yellow-800">
                                    <strong>Warning:</strong> Radio field "{field.label}" has no options configured. Please add options in the dashboard.
                                  </p>
                                </div>
                              )}
                            </>
                          )}

                          {/* Checkbox */}
                          {field.type === 'checkbox' && (
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id={`custom-${field.name}`}
                                checked={
                                  fieldValue === true || fieldValue === 'true'
                                }
                                onChange={(e) =>
                                  handleCustomFieldChange(
                                    field.name,
                                    e.target.checked
                                  )
                                }
                                required={field.required}
                                disabled={isSubmitting}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1 flex-shrink-0"
                              />
                              <label
                                htmlFor={`custom-${field.name}`}
                                className="text-sm text-gray-700 cursor-pointer"
                              >
                                {field.placeholder || field.label}
                              </label>
                            </div>
                          )}

                          {/* Fallback for unknown field types */}
                          {!['text', 'textarea', 'email', 'tel', 'number', 'date', 'select', 'radio', 'checkbox', 'separator'].includes(field.type) && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                <strong>Warning:</strong> Unknown field type "{field.type}" for field "{field.label}". Please contact support.
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

              {/* File Upload - moved to end */}
              <div className="pt-4 border-t-2 border-gray-100">
                <label
                  htmlFor="file-input"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Abstract File <span className="text-red-500">*</span>
                </label>
                <div className="mt-2">
                  <label
                    htmlFor="file-input"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or
                        drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Word documents or PDF (.doc, .docx, .pdf) - Max 10MB
                      </p>
                    </div>
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                    />
                  </label>
                  {file && (
                    <div className="mt-3 flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isSubmitting}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  style={
                    conference.primary_color
                      ? {
                          background: `linear-gradient(135deg, ${conference.primary_color} 0%, ${conference.primary_color}DD 100%)`,
                        }
                      : undefined
                  }
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Submit Abstract</span>
                    </>
                  )}
                </button>
              </div>

              {/* Info Note */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> After submission, you will receive a
                  confirmation email. If you have any questions, please contact
                  the conference organizers.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
