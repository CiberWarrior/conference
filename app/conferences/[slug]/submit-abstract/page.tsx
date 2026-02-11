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
import type { Author } from '@/types/author'
import { showSuccess, showError } from '@/utils/toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import AuthorManager from '@/components/admin/AuthorManager'

export default function SubmitAbstractPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string>('')
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [checkingRegistration, setCheckingRegistration] = useState(false)

  // Form state
  const [file, setFile] = useState<File | null>(null)
  const [customFields, setCustomFields] = useState<Record<string, any>>({})
  const [authors, setAuthors] = useState<Author[]>([
    {
      firstName: '',
      lastName: '',
      email: '',
      affiliation: '',
      country: '',
      city: '',
      isCorresponding: true,
      order: 1,
      customFields: {},
    },
  ])

  // Abstract details state
  const [abstractTitle, setAbstractTitle] = useState('')
  const [abstractContent, setAbstractContent] = useState('')
  const [abstractKeywords, setAbstractKeywords] = useState('')
  const [abstractType, setAbstractType] = useState<'poster' | 'oral' | 'invited'>('poster')

  useEffect(() => {
    if (!slug) return

    const loadConference = async () => {
      try {
        setLoading(true)
        // Add cache busting with timestamp to ensure fresh data
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/conferences/${slug}?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
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

  // Check if user has registration when corresponding author email changes
  const checkUserRegistration = async (email: string) => {
    if (!email || !conference?.id) return
    
    setCheckingRegistration(true)
    try {
      const response = await fetch(
        `/api/conferences/${conference.id}/check-registration?email=${encodeURIComponent(email)}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.registrationId) {
          setRegistrationId(data.registrationId)
          showSuccess('Pronađena registracija! Abstract će biti povezan sa vašom prijavom.')
        } else {
          setRegistrationId(null)
        }
      }
    } catch (err) {
      console.error('Error checking registration:', err)
      // Don't show error to user, it's optional
    } finally {
      setCheckingRegistration(false)
    }
  }

  // Watch for corresponding author email changes
  useEffect(() => {
    const correspondingAuthor = authors.find((a) => a.isCorresponding)
    if (correspondingAuthor?.email && correspondingAuthor.email.includes('@')) {
      // Debounce the check
      const timer = setTimeout(() => {
        checkUserRegistration(correspondingAuthor.email!)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setRegistrationId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authors.map(a => a.isCorresponding ? a.email : null).join(',')])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate abstract details
    if (!abstractTitle || abstractTitle.trim() === '') {
      showError('Abstract title is required')
      return
    }

    if (!abstractContent || abstractContent.trim() === '') {
      showError('Abstract content is required')
      return
    }

    // Validate character count (1000-2000 with spaces)
    const contentLength = abstractContent.length
    if (contentLength < 1000) {
      showError(`Abstract content is too short. Current: ${contentLength} characters. Minimum: 1000 characters.`)
      return
    }
    if (contentLength > 2000) {
      showError(`Abstract content is too long. Current: ${contentLength} characters. Maximum: 2000 characters.`)
      return
    }

    if (!abstractKeywords || abstractKeywords.trim() === '') {
      showError('Keywords are required')
      return
    }

    // Validate keywords (should have at least 5)
    const keywordsArray = abstractKeywords.split(',').map(k => k.trim()).filter(k => k)
    if (keywordsArray.length < 5) {
      showError(`Please enter at least 5 keywords. Current: ${keywordsArray.length}`)
      return
    }

    // Validate authors
    if (authors.length === 0) {
      showError('At least one author is required')
      return
    }

    // Validate each author has required fields
    for (let i = 0; i < authors.length; i++) {
      const author = authors[i]
      if (!author.firstName || author.firstName.trim() === '') {
        showError(`Author ${i + 1}: First name is required`)
        return
      }
      if (!author.lastName || author.lastName.trim() === '') {
        showError(`Author ${i + 1}: Last name is required`)
        return
      }
      if (!author.email || author.email.trim() === '') {
        showError(`Author ${i + 1}: Email is required`)
        return
      }
      if (!author.affiliation || author.affiliation.trim() === '') {
        showError(`Author ${i + 1}: Affiliation is required`)
        return
      }
    }

    // Ensure at least one corresponding author
    const hasCorresponding = authors.some((a) => a.isCorresponding)
    if (!hasCorresponding) {
      showError('Please select at least one corresponding author')
      return
    }

    // Validate required custom fields (skip separators)
    const abstractCustomFields = Array.isArray(conference?.settings?.custom_abstract_fields)
      ? conference.settings.custom_abstract_fields
      : []

    // Check if email is in custom fields
    const emailField = abstractCustomFields.find((f) => f && f.type === 'email')
    const email = emailField ? customFields[emailField.name] : authors.find(a => a.isCorresponding)?.email || authors[0]?.email
    
    if (!email) {
      showError('Email is required. Please fill in the email field.')
      return
    }

    // Validate all required fields including file uploads
    for (const field of abstractCustomFields) {
      if (field && field.type !== 'separator' && field.required) {
        const value = customFields[field.name]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          showError(`Please fill in the required field: ${field.label}`)
          return
        }
        
        // Validate minLength for longtext fields
        if (field.type === 'longtext' && field.validation?.minLength) {
          if (typeof value === 'string' && value.length < field.validation.minLength) {
            showError(`${field.label} must be at least ${field.validation.minLength} characters`)
            return
          }
        }
      }
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      
      // Append files from custom fields
      const fileFields = abstractCustomFields.filter(f => f && f.type === 'file')
      for (const fileField of fileFields) {
        const fileValue = customFields[fileField.name]
        if (fileValue && typeof fileValue === 'object' && 'name' in fileValue) {
          formData.append(`file_${fileField.name}`, fileValue as File)
        }
      }
      
      formData.append('email', email)
      
      // Append authors data
      formData.append('authors', JSON.stringify(authors))
      
      // Append abstract details
      formData.append('abstractTitle', abstractTitle)
      formData.append('abstractContent', abstractContent)
      formData.append('abstractKeywords', abstractKeywords)
      formData.append('abstractType', abstractType)
      
      // Append registration ID if found
      if (registrationId) {
        formData.append('registrationId', registrationId)
      }
      
      // Append custom_data as JSON (excluding files)
      const customDataWithoutFiles: Record<string, any> = {}
      for (const key in customFields) {
        const value = customFields[key]
        // Skip file objects, only send metadata or text values
        if (typeof value !== 'object' || value === null) {
          customDataWithoutFiles[key] = value
        } else if ('name' in value) {
          // Store file metadata instead of the file itself
          customDataWithoutFiles[key] = {
            fileName: (value as File).name,
            fileSize: (value as File).size,
            fileType: (value as File).type,
          }
        } else {
          customDataWithoutFiles[key] = value
        }
      }
      
      formData.append('custom_data', JSON.stringify(customDataWithoutFiles))

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
      setSubmittedEmail(email)
      showSuccess('Abstract submitted successfully!')

      // Reset form
      setCustomFields({})
      setAbstractTitle('')
      setAbstractContent('')
      setAbstractKeywords('')
      setAbstractType('poster')
      setAuthors([
        {
          firstName: '',
          lastName: '',
          email: '',
          affiliation: '',
          country: '',
          city: '',
          isCorresponding: true,
          order: 1,
          customFields: {},
        },
      ])
      
      // Reset all file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      fileInputs.forEach((input) => {
        (input as HTMLInputElement).value = ''
      })
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
                Simple submission process
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Flexible format options
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
                    submission and will review it shortly.
                    {submittedEmail && (
                      <> You will receive a confirmation email at {submittedEmail}.</>
                    )}
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
              {/* Abstract Information Text */}
              {conference.settings?.abstract_info_text && conference.settings.abstract_info_text.trim() !== '' && (
                <div className="bg-gradient-to-r from-purple-50 via-purple-50/80 to-purple-50/60 border-l-4 border-purple-500 p-8 mb-8 rounded-r-xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-purple-900 mb-3 tracking-tight">Abstract Information</h3>
                      <div className="text-base text-purple-800 whitespace-pre-line leading-relaxed">
                        {conference.settings.abstract_info_text}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Author Management */}
              <div className="border-2 border-purple-300 rounded-xl p-8 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white shadow-sm">
                <AuthorManager
                  authors={authors}
                  onChange={setAuthors}
                  maxAuthors={undefined}
                  customFields={[]}
                  showCustomFields={false}
                />
                
                {/* Registration Status Indicator */}
                {checkingRegistration && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Provjera registracije...</span>
                  </div>
                )}
                
                {!checkingRegistration && registrationId && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-3 rounded-lg border-2 border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Povezano sa registracijom</p>
                      <p className="text-xs text-green-600">
                        Ovaj abstract će biti automatski povezan sa vašom prijavom za konferenciju.
                      </p>
                    </div>
                  </div>
                )}
                
                {!checkingRegistration && !registrationId && authors.some(a => a.isCorresponding && a.email) && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Registracija nije pronađena</p>
                      <p className="text-xs text-amber-600">
                        Niste registrovani za konferenciju sa ovim emailom. 
                        Možete nastaviti sa submitom abstrackta, ali preporučujemo da se{' '}
                        <Link 
                          href={`/conferences/${slug}/register`}
                          className="underline font-medium hover:text-amber-800"
                          target="_blank"
                        >
                          registrujete ovdje
                        </Link>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Abstract Details Section */}
              <div className="space-y-6 border-2 border-blue-300 rounded-xl p-8 bg-gradient-to-br from-blue-50 via-blue-50/50 to-white shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <FileText className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Abstract Details</h3>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={abstractTitle}
                    onChange={(e) => setAbstractTitle(e.target.value)}
                    placeholder="Enter your abstract title"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={abstractContent}
                    onChange={(e) => setAbstractContent(e.target.value)}
                    placeholder="Enter your abstract content..."
                    required
                    disabled={isSubmitting}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y text-base"
                  />
                  <div className="mt-2 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <strong>Please note:</strong> Do NOT include references in the abstract text. Tables and graphics are not allowed.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        abstractContent.length < 1000
                          ? 'text-amber-600'
                          : abstractContent.length > 2000
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {abstractContent.length} / 2000 characters
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {abstractContent.length < 1000 
                          ? `Need ${1000 - abstractContent.length} more` 
                          : abstractContent.length > 2000
                          ? `${abstractContent.length - 2000} over limit`
                          : 'Perfect length'}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    The abstract should not have less than <strong>1000</strong> and more than <strong>2000</strong> characters with spaces.
                  </p>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Keywords <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={abstractKeywords}
                    onChange={(e) => setAbstractKeywords(e.target.value)}
                    placeholder="keyword1, keyword2, keyword3, keyword4, keyword5"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Please enter <strong>5 keywords</strong> relevant for your abstract using the name or acronym that is the best known. Separate them by comma.
                  </p>
                  {abstractKeywords && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className={`font-semibold ${
                        abstractKeywords.split(',').filter(k => k.trim()).length >= 5
                          ? 'text-green-600'
                          : 'text-amber-600'
                      }`}>
                        {abstractKeywords.split(',').filter(k => k.trim()).length} keywords entered
                      </span>
                    </div>
                  )}
                </div>

                {/* Abstract Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Abstract <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50">
                      <input
                        type="radio"
                        name="abstractType"
                        value="poster"
                        checked={abstractType === 'poster'}
                        onChange={(e) => setAbstractType(e.target.value as any)}
                        className="w-4 h-4 text-blue-600"
                        required
                      />
                      <span className="text-sm font-medium text-gray-900">Poster</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50">
                      <input
                        type="radio"
                        name="abstractType"
                        value="oral"
                        checked={abstractType === 'oral'}
                        onChange={(e) => setAbstractType(e.target.value as any)}
                        className="w-4 h-4 text-blue-600"
                        required
                      />
                      <span className="text-sm font-medium text-gray-900">Oral</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50">
                      <input
                        type="radio"
                        name="abstractType"
                        value="invited"
                        checked={abstractType === 'invited'}
                        onChange={(e) => setAbstractType(e.target.value as any)}
                        className="w-4 h-4 text-blue-600"
                        required
                      />
                      <span className="text-sm font-medium text-gray-900">Invited speaker</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              {conference.settings?.custom_abstract_fields &&
                Array.isArray(conference.settings.custom_abstract_fields) &&
                conference.settings.custom_abstract_fields.length > 0 && (
                  <div className="space-y-6">
                    {conference.settings.custom_abstract_fields
                      .filter((field) => {
                        if (!field || !field.type) return false
                        
                        // Filter out fields that are already covered in other sections
                        const coveredFieldNames = [
                          // Author-related fields (covered in AuthorManager)
                          'first_name', 'firstName', 'first name', 'ime',
                          'last_name', 'lastName', 'last name', 'prezime', 'surname',
                          'email', 'e-mail',
                          'institution', 'institutions', 'institucija', 'affiliation',
                          'country', 'država', 'drzava',
                          'city', 'grad',
                          'orcid',
                          'author', 'authors', 'autor', 'autori',
                          
                          // Abstract-related fields (covered in Abstract Details)
                          'abstract', 'abstrakt', 'sažetak', 'sazetak',
                          'title', 'naslov',
                          'content', 'sadržaj', 'sadrzaj',
                          'keywords', 'ključne riječi', 'kljucne rijeci',
                          'poster', 'oral', 'invited', 'invited speaker',
                          'abstract type', 'tip abstrakta', 'vrsta abstrakta'
                        ]
                        
                        const fieldNameLower = field.name?.toLowerCase() || ''
                        const fieldLabelLower = field.label?.toLowerCase() || ''
                        
                        // Skip if field name or label matches covered fields
                        const isCoveredField = coveredFieldNames.some(
                          coveredField => 
                            fieldNameLower.includes(coveredField.toLowerCase()) ||
                            fieldLabelLower.includes(coveredField.toLowerCase())
                        )
                        
                        return !isCoveredField
                      })
                      .map((field, idx) => {
                      // Skip separators from field value lookup
                      const fieldValue = field.type !== 'separator' ? (customFields[field.name] || '') : ''
                      

                      // Render separator
                      if (field.type === 'separator') {
                        return (
                          <div key={`separator-${field.id}-${idx}`} className="my-10">
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                              </div>
                              <div className="relative flex justify-center">
                                <div className="bg-white px-6 py-3">
                                  <h4 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    {field.label}
                                  </h4>
                                  {field.description && (
                                    <p className="text-sm text-gray-600 mt-2 text-center">
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
                        <div key={`field-${field.id}-${idx}`} className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 via-white to-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                          <label
                            htmlFor={`custom-${field.name}`}
                            className="block text-lg font-bold text-gray-900 mb-3"
                          >
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          {field.description && (
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
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
                              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y min-h-[100px] text-base hover:border-indigo-400 shadow-sm"
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
                              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base hover:border-indigo-400 shadow-sm"
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
                              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base hover:border-indigo-400 shadow-sm"
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
                              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base hover:border-indigo-400 shadow-sm"
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
                              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base hover:border-indigo-400 shadow-sm"
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
                              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base hover:border-indigo-400 shadow-sm"
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
                                <div className="space-y-3 bg-indigo-50/30 p-5 rounded-lg border-2 border-indigo-200/50 shadow-sm">
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
                                        className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                      />
                                      <label
                                        htmlFor={`custom-${field.name}-${optIdx}-${option}`}
                                        className="ml-3 text-base font-medium text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
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
                            <div className="flex items-start gap-3 p-4 bg-indigo-50/30 border-2 border-indigo-200/50 rounded-lg hover:bg-indigo-100/40 hover:border-indigo-300/60 transition-all shadow-sm">
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
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 mt-0.5 flex-shrink-0 cursor-pointer"
                              />
                              <label
                                htmlFor={`custom-${field.name}`}
                                className="text-base font-medium text-gray-900 cursor-pointer"
                              >
                                {field.placeholder || field.label}
                              </label>
                            </div>
                          )}

                          {/* Long Text (Paste with Character Counter) */}
                          {field.type === 'longtext' && (
                            <div>
                              <textarea
                                id={`custom-${field.name}`}
                                value={fieldValue}
                                onChange={(e) => {
                                  const value = e.target.value
                                  const maxLength = field.validation?.maxLength || 5000
                                  if (value.length <= maxLength) {
                                    handleCustomFieldChange(field.name, value)
                                  }
                                }}
                                required={field.required}
                                disabled={isSubmitting}
                                rows={12}
                                maxLength={field.validation?.maxLength || 5000}
                                placeholder={field.placeholder}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y font-mono text-sm"
                              />
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500">
                                  Paste your abstract text here (max {field.validation?.maxLength || 5000} characters)
                                </p>
                                <div className={`text-sm font-semibold ${
                                  (fieldValue?.length || 0) >= (field.validation?.maxLength || 5000) * 0.9
                                    ? 'text-red-600'
                                    : (fieldValue?.length || 0) >= (field.validation?.maxLength || 5000) * 0.7
                                    ? 'text-yellow-600'
                                    : 'text-gray-600'
                                }`}>
                                  {fieldValue?.length || 0} / {field.validation?.maxLength || 5000}
                                </div>
                              </div>
                              {field.validation?.minLength && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Minimum {field.validation.minLength} characters required
                                </p>
                              )}
                            </div>
                          )}

                          {/* File Upload */}
                          {field.type === 'file' && (
                            <div>
                              <label
                                htmlFor={`custom-file-${field.name}`}
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                  <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {field.fileTypes?.join(', ') || '.pdf, .doc, .docx'} - Max {field.maxFileSize || 10}MB
                                  </p>
                                </div>
                                <input
                                  id={`custom-file-${field.name}`}
                                  type="file"
                                  className="hidden"
                                  accept={field.fileTypes?.join(',') || '.pdf,.doc,.docx'}
                                  onChange={(e) => {
                                    const selectedFile = e.target.files?.[0]
                                    if (selectedFile) {
                                      // Validate file size
                                      const maxSize = (field.maxFileSize || 10) * 1024 * 1024 // Convert to bytes
                                      if (selectedFile.size > maxSize) {
                                        alert(`File size exceeds ${field.maxFileSize || 10}MB limit`)
                                        e.target.value = ''
                                        return
                                      }
                                      
                                      // Validate file type
                                      const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
                                      const allowedTypes = field.fileTypes || ['.pdf', '.doc', '.docx']
                                      if (!allowedTypes.includes(fileExt)) {
                                        alert(`File type not allowed. Please upload: ${allowedTypes.join(', ')}`)
                                        e.target.value = ''
                                        return
                                      }
                                      
                                      handleCustomFieldChange(field.name, selectedFile)
                                    }
                                  }}
                                  required={field.required}
                                  disabled={isSubmitting}
                                />
                              </label>
                              
                              {/* Show selected file */}
                              {fieldValue && typeof fieldValue === 'object' && 'name' in fieldValue && (
                                <div className="mt-3 flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                  <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {(fieldValue as File).name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {((fieldValue as File).size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleCustomFieldChange(field.name, null)
                                      const input = document.getElementById(`custom-file-${field.name}`) as HTMLInputElement
                                      if (input) input.value = ''
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                    disabled={isSubmitting}
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fallback for unknown field types */}
                          {!['text', 'textarea', 'longtext', 'file', 'email', 'tel', 'number', 'date', 'select', 'radio', 'checkbox', 'separator'].includes(field.type) && (
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

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full py-5 px-8 bg-gradient-to-r from-purple-600 via-purple-600 to-purple-700 text-white text-lg font-bold rounded-xl shadow-2xl hover:shadow-purple-500/50 hover:from-purple-700 hover:via-purple-700 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 overflow-hidden"
                  style={
                    conference.primary_color
                      ? {
                          background: `linear-gradient(135deg, ${conference.primary_color} 0%, ${conference.primary_color}DD 50%, ${conference.primary_color}CC 100%)`,
                        }
                      : undefined
                  }
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner />
                      <span className="relative z-10">Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-200" />
                      <span className="relative z-10">Submit Abstract</span>
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
