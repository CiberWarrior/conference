'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useConference } from '@/contexts/ConferenceContext'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Save, Trash2, Upload, Globe, Eye, EyeOff, Plus, X, GripVertical } from 'lucide-react'
import type { CustomPricingField, CustomFeeType, HotelOption, PaymentSettings } from '@/types/conference'
import Link from 'next/link'
import Image from 'next/image'
import type { Conference, CustomRegistrationField } from '@/types/conference'
import { showSuccess, showError, showWarning } from '@/utils/toast'
import CollapsibleFieldEditor from '@/components/admin/CollapsibleFieldEditor'
import type { ParticipantSettings } from '@/types/conference'
import { DEFAULT_PARTICIPANT_SETTINGS } from '@/types/participant'
import { DEFAULT_PAYMENT_SETTINGS } from '@/constants/defaultPaymentSettings'
import { formatPriceWithoutZeros } from '@/utils/pricing'

export default function ConferenceSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const { refreshConferences } = useConference()
  const { isSuperAdmin, profile } = useAuth()
  const conferenceId = params.id as string

  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [participantSettings, setParticipantSettings] = useState<ParticipantSettings>(DEFAULT_PARTICIPANT_SETTINGS)
  const [registrationInfoText, setRegistrationInfoText] = useState<string>('')
  const [abstractInfoText, setAbstractInfoText] = useState<string>('')
  const [showParticipantSettings, setShowParticipantSettings] = useState(false)
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null)
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null)
  const [expandedAbstractFieldId, setExpandedAbstractFieldId] = useState<string | null>(null)
  const [draggedAbstractFieldIndex, setDraggedAbstractFieldIndex] = useState<number | null>(null)
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([])
  const [draggedHotelIndex, setDraggedHotelIndex] = useState<number | null>(null)
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null)
  const [useDefaultVAT, setUseDefaultVAT] = useState(true) // Whether to use organization default VAT
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS)
  const [customFeeTypes, setCustomFeeTypes] = useState<CustomFeeType[]>([])
  const [expandedFeeTypeId, setExpandedFeeTypeId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    venue: '',
    website_url: '',
    logo_url: '' as string | undefined,
    primary_color: '#3B82F6',
    // Pricing
    currency: 'EUR',
    vat_percentage: '' as string | number, // PDV postotak (npr. 25 za 25%)
    prices_include_vat: false, // If true, entered prices are VAT-inclusive (sa PDV-om)
    early_bird_amount: 150,
    early_bird_deadline: '',
    regular_amount: 200,
    regular_start_date: '', // Optional - when regular pricing starts (default: early_bird_deadline + 1)
    late_amount: 250,
    late_start_date: '', // Optional - when late registration pricing starts
    student_discount: 50, // Legacy - kept for backward compatibility
    // Student pricing (fixed prices per tier)
    student_early_bird: 100,
    student_regular: 150,
    student_late: 200,
    accompanying_person_price: 140,
    custom_pricing_fields: [] as CustomPricingField[],
    // Settings
    registration_enabled: true,
    abstract_submission_enabled: true,
    payment_required: true,
    max_registrations: '',
    timezone: 'Europe/Zagreb',
    custom_registration_fields: [] as CustomRegistrationField[],
    custom_abstract_fields: [] as CustomRegistrationField[],
    // Email
    from_email: '',
    from_name: '',
    reply_to: '',
    // Status
    published: false,
    active: true,
  })

  useEffect(() => {
    loadConference()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId])

  const loadConference = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/conferences/${conferenceId}`)
      const data = await response.json()

      if (response.ok && data.conference) {
        const conf = data.conference
        setConference(conf)
        
        // Determine if using default VAT or custom
        const hasCustomVAT = conf.pricing?.vat_percentage !== null && conf.pricing?.vat_percentage !== undefined
        setUseDefaultVAT(!hasCustomVAT)
        
        setFormData({
          name: conf.name || '',
          description: conf.description || '',
          start_date: conf.start_date || '',
          end_date: conf.end_date || '',
          location: conf.location || '',
          venue: conf.venue || '',
          website_url: conf.website_url || '',
          logo_url: conf.logo_url || '',
          primary_color: conf.primary_color || '#3B82F6',
          // Pricing
          currency: conf.pricing?.currency || 'EUR',
          vat_percentage: conf.pricing?.vat_percentage || '',
          prices_include_vat: !!conf.pricing?.prices_include_vat,
          early_bird_amount: conf.pricing?.early_bird?.amount || 150,
          early_bird_deadline: conf.pricing?.early_bird?.deadline || '',
          regular_amount: conf.pricing?.regular?.amount || 200,
          regular_start_date: conf.pricing?.regular?.start_date || '',
          late_amount: conf.pricing?.late?.amount || 250,
          late_start_date: conf.pricing?.late?.start_date || '',
          student_discount: conf.pricing?.student_discount || 50,
          // Student pricing (use new structure if available, otherwise fallback to discount-based)
          student_early_bird: conf.pricing?.student?.early_bird || (conf.pricing?.early_bird?.amount || 150) - (conf.pricing?.student_discount || 50),
          student_regular: conf.pricing?.student?.regular || (conf.pricing?.regular?.amount || 200) - (conf.pricing?.student_discount || 50),
          student_late: conf.pricing?.student?.late || (conf.pricing?.late?.amount || 250) - (conf.pricing?.student_discount || 50),
          accompanying_person_price: conf.pricing?.accompanying_person_price || 0,
          custom_pricing_fields: conf.pricing?.custom_fields || [],
          // Settings
          registration_enabled: conf.settings?.registration_enabled ?? true,
          abstract_submission_enabled: conf.settings?.abstract_submission_enabled ?? true,
          payment_required: conf.settings?.payment_required ?? true,
          max_registrations: conf.settings?.max_registrations?.toString() || '',
          timezone: conf.settings?.timezone || 'Europe/Zagreb',
          custom_registration_fields: conf.settings?.custom_registration_fields || [],
          custom_abstract_fields: conf.settings?.custom_abstract_fields || [],
          // Email
          from_email: conf.email_settings?.from_email || '',
          from_name: conf.email_settings?.from_name || '',
          reply_to: conf.email_settings?.reply_to || '',
          // Status
          published: conf.published || false,
          active: conf.active ?? true,
        })
        
        // Load participant settings, payment settings, custom fee types, and info texts
        setParticipantSettings(conf.settings?.participant_settings || DEFAULT_PARTICIPANT_SETTINGS)
        setPaymentSettings(conf.settings?.payment_settings || DEFAULT_PAYMENT_SETTINGS)
        setCustomFeeTypes(conf.pricing?.custom_fee_types || [])
        setRegistrationInfoText(conf.settings?.registration_info_text || '')
        setAbstractInfoText(conf.settings?.abstract_info_text || `Guidelines:

The abstract should be written in English
The abstract should not exceed 2000 characters
Indicate the topic and type of your presentation
The abstract should include the title, names of all contributors (without titles), department, institution, city, and country.
Names of author and co-authors have to be submitted in the following way: First and Last name (example:  John Smith)
Contact author (presenter) should submit his/her phone number and Email address
The submitted abstract should cover the following: the goal, material and methods, results, and conclusion
Abstract should be submitted as one paragraph
Do NOT include references in the abstract text. Tables and graphics are not allowed.
Corrections - Withdrawal and Editing an abstract already submitted

Changes, withdrawals, and editing can be made until March 22, 2026, 24.00 hrs CET, by sending the new summary by mail.
The Abstract has to be related to one of the conference topics.

Important: Authors who submit abstracts for presentation are not automatically registered for the meeting.`)
        setShowParticipantSettings(conf.settings?.participant_settings?.enabled || false)
        setHotelOptions(conf.settings?.hotel_options || [])
      }
    } catch (error) {
      console.error('Failed to load conference:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  // Custom Pricing Fields Management
  const addCustomPricingField = () => {
    const newField: CustomPricingField = {
      id: `custom_${Date.now()}`,
      name: '',
      value: 0,
      description: '',
    }
    setFormData((prev) => ({
      ...prev,
      custom_pricing_fields: [...prev.custom_pricing_fields, newField],
    }))
  }

  const removeCustomPricingField = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      custom_pricing_fields: prev.custom_pricing_fields.filter((field) => field.id !== id),
    }))
  }

  const updateCustomPricingField = (id: string, field: Partial<CustomPricingField>) => {
    setFormData((prev) => ({
      ...prev,
      custom_pricing_fields: prev.custom_pricing_fields.map((f) =>
        f.id === id ? { ...f, ...field } : f
      ),
    }))
  }

  // Custom Fee Types Management
  const addCustomFeeType = () => {
    const newFeeType: CustomFeeType = {
      id: `fee_type_${Date.now()}`,
      name: '',
      description: '',
      early_bird: 0,
      regular: 0,
      late: 0,
    }
    setCustomFeeTypes([...customFeeTypes, newFeeType])
    setExpandedFeeTypeId(newFeeType.id)
  }

  const removeCustomFeeType = (id: string) => {
    setCustomFeeTypes(customFeeTypes.filter((ft) => ft.id !== id))
  }

  const updateCustomFeeType = (id: string, updates: Partial<CustomFeeType>) => {
    setCustomFeeTypes(customFeeTypes.map((ft) =>
      ft.id === id ? { ...ft, ...updates } : ft
    ))
  }

  // Hotel Options Management
  const addHotelOption = () => {
    const newHotel: HotelOption = {
      id: `hotel_${Date.now()}`,
      name: '',
      occupancy: '1 person',
      pricePerNight: 0,
      description: '',
      order: hotelOptions.length,
    }
    setHotelOptions([...hotelOptions, newHotel])
  }

  const removeHotelOption = (id: string) => {
    setHotelOptions(hotelOptions.filter((hotel) => hotel.id !== id))
  }

  const updateHotelOption = (id: string, updates: Partial<HotelOption>) => {
    setHotelOptions(hotelOptions.map((hotel) =>
      hotel.id === id ? { ...hotel, ...updates } : hotel
    ))
  }

  const handleHotelDragStart = (index: number) => {
    setDraggedHotelIndex(index)
  }

  const handleHotelDrop = (targetIndex: number) => {
    if (draggedHotelIndex === null) return

    const newHotels = [...hotelOptions]
    const draggedHotel = newHotels[draggedHotelIndex]
    newHotels.splice(draggedHotelIndex, 1)
    newHotels.splice(targetIndex, 0, draggedHotel)

    // Update order numbers
    const updatedHotels = newHotels.map((hotel, idx) => ({
      ...hotel,
      order: idx,
    }))

    setHotelOptions(updatedHotels)
    setDraggedHotelIndex(null)
  }

  // Custom Registration Fields Management
  const addCustomRegistrationField = () => {
    const newField: CustomRegistrationField = {
      id: `reg_field_${Date.now()}`,
      name: '',
      type: 'text', // Default to text field
      label: '',
      placeholder: '',
      description: '',
      required: false,
      options: undefined,
    }
    setFormData((prev) => ({
      ...prev,
      custom_registration_fields: [...prev.custom_registration_fields, newField],
    }))
    // Automatically expand the newly added field
    setExpandedFieldId(newField.id)
  }

  const removeCustomRegistrationField = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      custom_registration_fields: prev.custom_registration_fields.filter((field) => field.id !== id),
    }))
  }

  const updateCustomRegistrationField = (id: string, field: Partial<CustomRegistrationField>) => {
    setFormData((prev) => ({
      ...prev,
      custom_registration_fields: prev.custom_registration_fields.map((f) =>
        f.id === id ? { ...f, ...field } : f
      ),
    }))
  }

  // Drag and Drop handlers for reordering fields
  const handleDragStart = (index: number) => {
    setDraggedFieldIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    
    if (draggedFieldIndex === null || draggedFieldIndex === index) return

    const fields = [...formData.custom_registration_fields]
    const draggedField = fields[draggedFieldIndex]
    
    // Remove from old position
    fields.splice(draggedFieldIndex, 1)
    // Insert at new position
    fields.splice(index, 0, draggedField)
    
    setFormData((prev) => ({
      ...prev,
      custom_registration_fields: fields,
    }))
    
    setDraggedFieldIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedFieldIndex(null)
  }

  // Custom Abstract Fields Management
  const addCustomAbstractField = () => {
    const newField: CustomRegistrationField = {
      id: `abstract_field_${Date.now()}`,
      name: '',
      type: 'text',
      label: '',
      placeholder: '',
      description: '',
      required: false,
      options: undefined,
    }
    setFormData((prev) => ({
      ...prev,
      custom_abstract_fields: [...prev.custom_abstract_fields, newField],
    }))
    setExpandedAbstractFieldId(newField.id)
  }

  const addCustomAbstractSeparator = () => {
    const newField: CustomRegistrationField = {
      id: `abstract_separator_${Date.now()}`,
      name: '', // Separators don't need a name field
      type: 'separator',
      label: 'New Section',
      placeholder: '',
      description: '',
      required: false,
      options: undefined,
    }
    setFormData((prev) => ({
      ...prev,
      custom_abstract_fields: [...prev.custom_abstract_fields, newField],
    }))
    setExpandedAbstractFieldId(newField.id)
  }

  const removeCustomAbstractField = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      custom_abstract_fields: prev.custom_abstract_fields.filter((field) => field.id !== id),
    }))
  }

  const updateCustomAbstractField = (id: string, field: Partial<CustomRegistrationField>) => {
    setFormData((prev) => ({
      ...prev,
      custom_abstract_fields: prev.custom_abstract_fields.map((f) =>
        f.id === id ? { ...f, ...field } : f
      ),
    }))
  }

  // Drag and Drop handlers for abstract fields
  const handleAbstractDragStart = (index: number) => {
    setDraggedAbstractFieldIndex(index)
  }

  const handleAbstractDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    
    if (draggedAbstractFieldIndex === null || draggedAbstractFieldIndex === index) return

    const fields = [...formData.custom_abstract_fields]
    const draggedField = fields[draggedAbstractFieldIndex]
    
    fields.splice(draggedAbstractFieldIndex, 1)
    fields.splice(index, 0, draggedField)
    
    setFormData((prev) => ({
      ...prev,
      custom_abstract_fields: fields,
    }))
    
    setDraggedAbstractFieldIndex(index)
  }

  const handleAbstractDragEnd = () => {
    setDraggedAbstractFieldIndex(null)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showError('File size must be less than 2MB')
      return
    }

    setUploadingLogo(true)
    try {
      // Upload to Supabase Storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conferenceId', conferenceId)

      const response = await fetch('/api/admin/conferences/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Save logo URL to database immediately
        const saveResponse = await fetch(`/api/admin/conferences/${conferenceId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({ logo_url: data.url }),
        })

        if (saveResponse.ok) {
          await saveResponse.json()
          setFormData((prev) => ({ ...prev, logo_url: data.url }))
          // Reload conference to show updated logo without full page refresh
          await loadConference()
          showSuccess('Logo uploaded successfully!')
        } else {
          const saveData = await saveResponse.json()
          showError(`Logo uploaded but failed to save: ${saveData.error || 'Unknown error'}`)
          console.error('Save error:', saveData)
        }
      } else {
        const errorMsg = data.details 
          ? `${data.error}: ${data.details}${data.hint ? `\n\nHint: ${data.hint}` : ''}`
          : data.error || 'Failed to upload logo'
        showError(errorMsg)
        console.error('Upload error:', data)
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      showError('Failed to upload logo. Please check the console for details.')
    } finally {
      setUploadingLogo(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/conferences/${conferenceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
          location: formData.location || undefined,
          venue: formData.venue || undefined,
          website_url: formData.website_url || undefined,
          logo_url: formData.logo_url || undefined,
          primary_color: formData.primary_color,
          pricing: {
            currency: formData.currency,
            vat_percentage: useDefaultVAT 
              ? null  // Use organization default (null means fallback to user profile)
              : formData.vat_percentage 
                ? parseFloat(formData.vat_percentage.toString()) 
                : null,
            prices_include_vat: !!formData.prices_include_vat,
            early_bird: {
              amount: formData.early_bird_amount,
              deadline: formData.early_bird_deadline || undefined,
            },
            regular: {
              amount: formData.regular_amount,
              start_date: formData.regular_start_date || undefined,
            },
            late: {
              amount: formData.late_amount,
              start_date: formData.late_start_date || undefined,
            },
            // Student pricing (new structure)
            student: {
              early_bird: formData.student_early_bird,
              regular: formData.student_regular,
              late: formData.student_late,
            },
            student_discount: formData.student_discount, // Keep for backward compatibility
            accompanying_person_price: formData.accompanying_person_price || undefined,
            custom_fields: formData.custom_pricing_fields.length > 0 ? formData.custom_pricing_fields : undefined,
            custom_fee_types: customFeeTypes.length > 0 ? customFeeTypes : undefined,
          },
          settings: {
            registration_enabled: formData.registration_enabled,
            abstract_submission_enabled: formData.abstract_submission_enabled,
            payment_required: formData.payment_required,
            max_registrations: formData.max_registrations ? parseInt(formData.max_registrations) : null,
            timezone: formData.timezone,
            // Always send arrays, even if empty - this ensures they're properly saved
            custom_registration_fields: formData.custom_registration_fields,
            custom_abstract_fields: formData.custom_abstract_fields,
            participant_settings: participantSettings,
            payment_settings: paymentSettings,
            registration_info_text: registrationInfoText || undefined,
            abstract_info_text: abstractInfoText || undefined,
            hotel_options: hotelOptions.length > 0 ? hotelOptions : undefined,
          },
          email_settings: {
            from_email: formData.from_email || undefined,
            from_name: formData.from_name || undefined,
            reply_to: formData.reply_to || undefined,
          },
          published: formData.published,
          active: formData.active,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await refreshConferences()
        // Reload conference data to ensure we have the latest from database
        await loadConference()
        showSuccess('Conference settings saved successfully!')
      } else {
        console.error('API Error:', data)
        showError(`Failed to save: ${data.error}`)
      }
    } catch (error) {
      showError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${conference?.name}"? This will permanently delete all registrations, abstracts, and related data. This action cannot be undone!`)) {
      return
    }

    if (!confirm('This is your last chance! Type DELETE to confirm:') || prompt('Type DELETE to confirm:') !== 'DELETE') {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/conferences/${conferenceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await refreshConferences()
        showSuccess('Conference deleted successfully')
        router.push('/admin/conferences')
      } else {
        const data = await response.json()
        showError(`Failed to delete: ${data.error}`)
      }
    } catch (error) {
      showError('An error occurred while deleting')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conference settings...</p>
        </div>
      </div>
    )
  }

  if (!conference) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">Conference not found</p>
          <Link
            href="/admin/conferences"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to conferences
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/conferences"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Conferences
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conference Settings</h1>
            <p className="text-gray-600 mt-2">{conference.name}</p>
            {conference.slug && (
              <Link
                href={`/conferences/${conference.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                <Globe className="w-3 h-3" />
                View Conference Page
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Custom Pages (Phase 1) */}
            <Link
              href={`/admin/conferences/${conferenceId}/pages`}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Pages
            </Link>
            {/* Preview Button */}
            {conference.slug && (
              <Link
                href={`/conferences/${conference.slug}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Link>
            )}
            {/* Publish Toggle */}
            <button
              onClick={() => setFormData(prev => ({ ...prev, published: !prev.published }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                formData.published
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {formData.published ? (
                <>
                  <Eye className="w-4 h-4" />
                  Published
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Draft
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Conference Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label htmlFor="venue" className="block text-sm font-semibold text-gray-700 mb-2">
                  Venue
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="website_url" className="block text-sm font-semibold text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  id="website_url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="primary_color" className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="primary_color"
                    name="primary_color"
                    value={formData.primary_color}
                    onChange={handleChange}
                    className="w-16 h-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Conference Logo
              </label>
              <div className="flex items-start gap-4">
                {conference.logo_url && (
                  <div className="flex-shrink-0">
                    <Image
                      src={conference.logo_url}
                      alt="Current logo"
                      width={120}
                      height={120}
                      className="w-24 h-24 object-contain border-2 border-gray-200 rounded-lg p-2 bg-gray-50"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="file"
                      id="logo_upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {uploadingLogo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-600">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Uploading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Upload a logo image (PNG, JPG, SVG). Max size: 2MB. Or enter a URL below.
                  </p>
                  <input
                    type="url"
                    placeholder="Or enter logo URL"
                    value={formData.logo_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Information Text */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Information</h2>
            <p className="text-sm text-gray-600">
              Add introductory text or instructions that will appear at the top of the registration form.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Information Text
            </label>
            <textarea
              value={registrationInfoText}
              onChange={(e) => setRegistrationInfoText(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter information text that will be displayed to users when they register. For example: registration details, requirements, deadlines, etc."
            />
            <p className="text-xs text-gray-500 mt-2">
              This text will be displayed at the beginning of the registration form
            </p>
          </div>
        </div>

        {/* Conference Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Conference Settings</h2>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="registration_enabled"
                checked={formData.registration_enabled}
                onChange={handleChange}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-gray-900">Enable Registration</p>
                <p className="text-sm text-gray-600">Allow participants to register for the conference</p>
              </div>
            </label>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">Abstract Submission</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Abstract submission is handled by a separate application. When enabled, a link to the abstract submission platform will be displayed on the conference page.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="abstract_submission_enabled"
                      checked={formData.abstract_submission_enabled}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Show abstract submission link on conference page</span>
                  </label>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="payment_required"
                checked={formData.payment_required}
                onChange={handleChange}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-gray-900">Require Payment</p>
                <p className="text-sm text-gray-600">Participants must pay registration fee</p>
              </div>
            </label>

            <div>
              <label htmlFor="max_registrations" className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Registrations (optional)
              </label>
              <input
                type="number"
                id="max_registrations"
                name="max_registrations"
                value={formData.max_registrations}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Options</h2>
            <p className="text-sm text-gray-600">
              Configure which payment methods are available for this conference
            </p>
          </div>

          <div className="space-y-6">
            {/* Enable Payment System Toggle */}
            <div className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Payment System</h3>
                <p className="text-sm text-gray-600">
                  Enable payment processing for this conference
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentSettings({
                    ...paymentSettings,
                    enabled: !paymentSettings.enabled,
                  })
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  paymentSettings.enabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    paymentSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {paymentSettings.enabled && (
              <>
                {/* Payment Methods */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Available Payment Methods</h3>
                  
                  {/* Card Payment */}
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                    <input
                      type="checkbox"
                      checked={paymentSettings.allow_card}
                      onChange={(e) => {
                        setPaymentSettings({
                          ...paymentSettings,
                          allow_card: e.target.checked,
                        })
                      }}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">💳 Card Payment (Stripe)</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Instant
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Accept credit/debit card payments through Stripe
                      </p>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                    <input
                      type="checkbox"
                      checked={paymentSettings.allow_bank_transfer}
                      onChange={(e) => {
                        setPaymentSettings({
                          ...paymentSettings,
                          allow_bank_transfer: e.target.checked,
                        })
                      }}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">🏦 Bank Transfer</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          1-2 days
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Allow participants to pay via bank transfer (requires manual verification)
                      </p>
                      {!profile?.bank_account_number && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                          ⚠️ Bank account not configured. Go to Account Settings to add bank details.
                        </p>
                      )}
                    </div>
                  </label>
                </div>

                {/* Default Preference */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Default Payment Preference
                  </label>
                  <select
                    value={paymentSettings.default_preference}
                    onChange={(e) => {
                      setPaymentSettings({
                        ...paymentSettings,
                        // Pay Later removed from UI; keep stored values backward-compatible
                        default_preference: e.target.value as 'pay_now_card' | 'pay_now_bank',
                      })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentSettings.allow_card && (
                      <option value="pay_now_card">Card Payment (Recommended for instant confirmation)</option>
                    )}
                    {paymentSettings.allow_bank_transfer && (
                      <option value="pay_now_bank">Bank Transfer</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500">
                    This option will be pre-selected in the registration form
                  </p>
                </div>

                {/* Payment Requirements */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentSettings.required_at_registration}
                      onChange={(e) => {
                        setPaymentSettings({
                          ...paymentSettings,
                          required_at_registration: e.target.checked,
                        })
                      }}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Require Payment Preference at Registration</p>
                      <p className="text-sm text-gray-600 mt-1">
                        If enabled, participants must select a payment method during registration
                      </p>
                    </div>
                  </label>
                </div>

                {/* Deadlines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Transfer Deadline (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={paymentSettings.bank_transfer_deadline_days}
                      onChange={(e) => {
                        setPaymentSettings({
                          ...paymentSettings,
                          bank_transfer_deadline_days: parseInt(e.target.value) || 7,
                        })
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Days after registration to complete bank transfer
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      General Payment Deadline (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={paymentSettings.payment_deadline_days}
                      onChange={(e) => {
                        setPaymentSettings({
                          ...paymentSettings,
                          payment_deadline_days: parseInt(e.target.value) || 30,
                        })
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Days after registration to complete payment
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex gap-3">
                    <div className="text-purple-600 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Payment Reminders</p>
                      <p className="text-sm text-gray-600">
                        Automatic payment reminders will be sent 3 days after registration for pending payments.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Multiple Participants Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Multiple Participants</h2>
              <p className="text-sm text-gray-600">
                Enable this feature to allow registrations with multiple participants (e.g., group registrations, conference delegations).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setParticipantSettings({
                  ...participantSettings,
                  enabled: !participantSettings.enabled,
                })
                setShowParticipantSettings(!showParticipantSettings)
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                participantSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  participantSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {showParticipantSettings && (
            <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
              {/* Participant Label */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Participant Label
                </label>
                <input
                  type="text"
                  value={participantSettings.participantLabel || 'Participant'}
                  onChange={(e) => {
                    setParticipantSettings({
                      ...participantSettings,
                      participantLabel: e.target.value,
                    })
                  }}
                  placeholder="e.g., Participant, Attendee, Delegate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This label will be used in the form (e.g., "Add Participant")
                </p>
              </div>

              {/* Min/Max Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Minimum Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={participantSettings.maxParticipants}
                    value={participantSettings.minParticipants}
                    onChange={(e) => {
                      setParticipantSettings({
                        ...participantSettings,
                        minParticipants: parseInt(e.target.value) || 1,
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maximum Participants
                  </label>
                  <input
                    type="number"
                    min={participantSettings.minParticipants}
                    value={participantSettings.maxParticipants}
                    onChange={(e) => {
                      setParticipantSettings({
                        ...participantSettings,
                        maxParticipants: parseInt(e.target.value) || 5,
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set the maximum number of participants allowed per registration</p>
                </div>
              </div>

              {/* Require Unique Emails */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="requireUniqueEmails"
                  checked={participantSettings.requireUniqueEmails}
                  onChange={(e) => {
                    setParticipantSettings({
                      ...participantSettings,
                      requireUniqueEmails: e.target.checked,
                    })
                  }}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="requireUniqueEmails" className="text-sm text-gray-700">
                  <span className="font-semibold">Require unique email addresses</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Each participant must have a unique email address
                  </p>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Custom Registration Fields */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Custom Registration Fields</h2>
            <p className="text-sm text-gray-600">
              Add custom fields to the registration form. Participants will see and fill these fields when registering.
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {formData.custom_registration_fields.length} field(s) configured
            </div>
            <button
              type="button"
              onClick={addCustomRegistrationField}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </button>
          </div>

          {formData.custom_registration_fields.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">No custom registration fields yet</p>
              <p className="text-gray-400 text-xs mt-1">Click "Add Field" to create your first custom field</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.custom_registration_fields.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all duration-200 ${
                    draggedFieldIndex === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <CollapsibleFieldEditor
                    field={field}
                    index={index}
                    onUpdate={updateCustomRegistrationField}
                    onRemove={removeCustomRegistrationField}
                    isExpanded={expandedFieldId === field.id}
                    onToggleExpand={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registration Fee */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-blue-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Registration Fee</h2>
              <p className="text-sm text-gray-600">
                Set registration fees for different pricing tiers. The system automatically applies the correct price based on the current date and early bird deadline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EUR">EUR (€) - Euro</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CHF">CHF (Fr) - Swiss Franc</option>
                <option value="JPY">JPY (¥) - Japanese Yen</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="NZD">NZD ($) - New Zealand Dollar</option>
                <option value="SEK">SEK (kr) - Swedish Krona</option>
                <option value="NOK">NOK (kr) - Norwegian Krone</option>
                <option value="DKK">DKK (kr) - Danish Krone</option>
                <option value="PLN">PLN (zł) - Polish Zloty</option>
                <option value="CZK">CZK (Kč) - Czech Koruna</option>
                <option value="HUF">HUF (Ft) - Hungarian Forint</option>
                <option value="RON">RON (lei) - Romanian Leu</option>
                <option value="BGN">BGN (лв) - Bulgarian Lev</option>
                <option value="RSD">RSD (дин) - Serbian Dinar</option>
                <option value="BAM">BAM (КМ) - Bosnia and Herzegovina Convertible Mark</option>
                <option value="MKD">MKD (ден) - Macedonian Denar</option>
                <option value="CNY">CNY (¥) - Chinese Yuan</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="BRL">BRL (R$) - Brazilian Real</option>
                <option value="MXN">MXN ($) - Mexican Peso</option>
                <option value="ZAR">ZAR (R) - South African Rand</option>
                <option value="KRW">KRW (₩) - South Korean Won</option>
                <option value="SGD">SGD ($) - Singapore Dollar</option>
                <option value="HKD">HKD ($) - Hong Kong Dollar</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
                <option value="SAR">SAR (﷼) - Saudi Riyal</option>
                <option value="ILS">ILS (₪) - Israeli Shekel</option>
                <option value="TRY">TRY (₺) - Turkish Lira</option>
                <option value="RUB">RUB (₽) - Russian Ruble</option>
              </select>
            </div>

            {/* VAT Settings */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                PDV / VAT Settings
              </label>
              
              <div className="space-y-3">
                {/* Radio: Use organization default */}
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50/50" style={{
                  borderColor: useDefaultVAT ? '#3B82F6' : '#E5E7EB',
                  backgroundColor: useDefaultVAT ? '#EFF6FF' : 'white'
                }}>
                  <input
                    type="radio"
                    name="vat_option"
                    checked={useDefaultVAT}
                    onChange={() => setUseDefaultVAT(true)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      Use organization default
                      {profile?.default_vat_percentage && (
                        <span className="ml-2 text-blue-600">
                          ({profile.default_vat_percentage}% 
                          {profile.vat_label && ` - ${profile.vat_label}`})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {profile?.default_vat_percentage 
                        ? 'Recommended: Use the default VAT setting from your organization profile.'
                        : 'No default VAT set. Go to Account Settings to set one.'}
                    </p>
                  </div>
                </label>

                {/* Radio: Custom VAT */}
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50/50" style={{
                  borderColor: !useDefaultVAT ? '#9333EA' : '#E5E7EB',
                  backgroundColor: !useDefaultVAT ? '#FAF5FF' : 'white'
                }}>
                  <input
                    type="radio"
                    name="vat_option"
                    checked={!useDefaultVAT}
                    onChange={() => setUseDefaultVAT(false)}
                    className="mt-1 w-4 h-4 text-purple-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      Set custom VAT for this conference
                    </div>
                    <p className="text-sm text-gray-600 mt-1 mb-3">
                      Override the organization default (e.g., for conferences in different countries)
                    </p>
                    
                    {/* Custom VAT input (only enabled when custom selected) */}
                    <input
                      type="number"
                      value={formData.vat_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, vat_percentage: e.target.value }))}
                      disabled={useDefaultVAT}
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="npr. 19 za 19% (Germany)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <strong>Tip:</strong> PDV će se prikazivati u admin dashboardu kao "bez PDV-a" i "sa PDV-om". 
                  Na registracijskoj formi korisnici će vidjeti samo krajnju cijenu sa PDV-om.
                </p>
              </div>

              {/* Price Input Mode */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price Input Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50/50"
                    style={{
                      borderColor: !formData.prices_include_vat ? '#3B82F6' : '#E5E7EB',
                      backgroundColor: !formData.prices_include_vat ? '#EFF6FF' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="prices_include_vat"
                      checked={!formData.prices_include_vat}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, prices_include_vat: false }))
                      }
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Prices are entered without PDV (net)</div>
                      <p className="text-sm text-gray-600 mt-1">
                        Example: Enter 400 → public shows 500 if PDV is 25%.
                      </p>
                    </div>
                  </label>

                  <label
                    className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50/50"
                    style={{
                      borderColor: formData.prices_include_vat ? '#9333EA' : '#E5E7EB',
                      backgroundColor: formData.prices_include_vat ? '#FAF5FF' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="prices_include_vat"
                      checked={!!formData.prices_include_vat}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, prices_include_vat: true }))
                      }
                      className="mt-1 w-4 h-4 text-purple-600"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Prices are entered with PDV included (gross)</div>
                      <p className="text-sm text-gray-600 mt-1">
                        Example: Enter 400 → public shows 400, admin calculates net from PDV.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Standard Participant Pricing */}
            <div className="md:col-span-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-transparent"></div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Standard Participant</h3>
                <div className="h-px flex-1 bg-gradient-to-l from-blue-200 to-transparent"></div>
              </div>
            </div>

            <div>
              <label htmlFor="early_bird_amount" className="block text-sm font-semibold text-gray-700 mb-2">
                Early Bird Price
              </label>
              <input
                type="number"
                id="early_bird_amount"
                name="early_bird_amount"
                value={formData.early_bird_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="npr. 150.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Price during the early bird period (before the deadline).
              </p>
            </div>

            <div>
              <label htmlFor="early_bird_deadline" className="block text-sm font-semibold text-gray-700 mb-2">
                Early Bird Deadline
              </label>
              <input
                type="date"
                id="early_bird_deadline"
                name="early_bird_deadline"
                value={formData.early_bird_deadline}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                After this date, regular pricing will apply automatically
              </p>
            </div>

            <div>
              <label htmlFor="regular_amount" className="block text-sm font-semibold text-gray-700 mb-2">
                Regular Price
              </label>
              <input
                type="number"
                id="regular_amount"
                name="regular_amount"
                value={formData.regular_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="npr. 200.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Default price after early bird ends.
              </p>
            </div>

            <div>
              <label htmlFor="regular_start_date" className="block text-sm font-semibold text-gray-700 mb-2">
                Regular Start Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                id="regular_start_date"
                name="regular_start_date"
                value={formData.regular_start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                When regular pricing starts. If not set, defaults to the day after Early Bird Deadline.
              </p>
            </div>

            <div>
              <label htmlFor="late_amount" className="block text-sm font-semibold text-gray-700 mb-2">
                Late Registration Price
              </label>
              <input
                type="number"
                id="late_amount"
                name="late_amount"
                value={formData.late_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="npr. 250.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Applied when late registration is active (after regular period).
              </p>
            </div>

            <div>
              <label htmlFor="late_start_date" className="block text-sm font-semibold text-gray-700 mb-2">
                Late Registration Start Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                id="late_start_date"
                name="late_start_date"
                value={formData.late_start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                When late registration pricing starts. If not set, late pricing applies after regular period ends.
              </p>
            </div>

            {/* Student Pricing */}
            <div className="md:col-span-2 mb-2 mt-6">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-green-200 to-transparent"></div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Student Pricing</h3>
                <div className="h-px flex-1 bg-gradient-to-l from-green-200 to-transparent"></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Set fixed prices for students across all pricing tiers
              </p>
            </div>

            <div>
              <label htmlFor="student_early_bird" className="block text-sm font-semibold text-gray-700 mb-2">
                Student Early Bird
              </label>
              <input
                type="number"
                id="student_early_bird"
                name="student_early_bird"
                value={formData.student_early_bird}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="npr. 100.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Fixed student price during early bird (not a discount).
              </p>
            </div>

            <div>
              <label htmlFor="student_regular" className="block text-sm font-semibold text-gray-700 mb-2">
                Student Regular
              </label>
              <input
                type="number"
                id="student_regular"
                name="student_regular"
                value={formData.student_regular}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="npr. 150.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Fixed student price for the regular period.
              </p>
            </div>

            <div>
              <label htmlFor="student_late" className="block text-sm font-semibold text-gray-700 mb-2">
                Student Late Registration
              </label>
              <input
                type="number"
                id="student_late"
                name="student_late"
                value={formData.student_late}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="npr. 200.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Fixed student price for late registration.
              </p>
            </div>

            {/* Custom Fee Types */}
            <div className="md:col-span-2 mb-4 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-purple-200 to-transparent"></div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Custom Fee Types</h3>
                <div className="h-px flex-1 bg-gradient-to-l from-purple-200 to-transparent"></div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500">
                  Add custom participant types with specific pricing (e.g., VIP Member, Senior Citizen, etc.)
                </p>
                <button
                  type="button"
                  onClick={addCustomFeeType}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Fee Type
                </button>
              </div>

              {customFeeTypes.length === 0 ? (
                <div className="text-center py-8 bg-purple-50 rounded-lg border-2 border-dashed border-purple-200">
                  <p className="text-gray-500 text-sm">No custom fee types yet</p>
                  <p className="text-gray-400 text-xs mt-1">Click &quot;Add Fee Type&quot; to create custom pricing for specific groups</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customFeeTypes.map((feeType, index) => {
                    const isExpanded = expandedFeeTypeId === feeType.id
                    return (
                      <div
                        key={feeType.id}
                        className="bg-purple-50 rounded-lg border-2 border-purple-200 p-4 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <button
                              type="button"
                              onClick={() => setExpandedFeeTypeId(isExpanded ? null : feeType.id)}
                              className="text-left w-full"
                            >
                              <h4 className="text-sm font-bold text-purple-900">
                                {feeType.name || `Custom Fee Type #${index + 1}`}
                              </h4>
                              {feeType.description && (
                                <p className="text-xs text-purple-700 mt-1">{feeType.description}</p>
                              )}
                              {!isExpanded && feeType.name && (
                                <p className="text-xs text-purple-600 mt-1">
                                  Early Bird: {feeType.early_bird} {formData.currency} | Regular: {feeType.regular} {formData.currency} | Late: {feeType.late} {formData.currency}
                                </p>
                              )}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCustomFeeType(feeType.id)}
                            className="text-red-600 hover:text-red-700 transition-colors ml-2"
                            title="Remove fee type"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="space-y-3 pt-3 border-t border-purple-200">
                            <div>
                              <label className="block text-xs font-semibold text-purple-900 mb-1">
                                Fee Type Name *
                              </label>
                              <input
                                type="text"
                                value={feeType.name}
                                onChange={(e) => updateCustomFeeType(feeType.id, { name: e.target.value })}
                                placeholder="e.g., VIP Member, Senior Citizen"
                                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-purple-900 mb-1">
                                Description (optional)
                              </label>
                              <input
                                type="text"
                                value={feeType.description || ''}
                                onChange={(e) => updateCustomFeeType(feeType.id, { description: e.target.value })}
                                placeholder="Brief description of this fee type"
                                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-purple-900 mb-1">
                                  Early Bird
                                </label>
                                <input
                                  type="number"
                                  value={feeType.early_bird}
                                  onChange={(e) => updateCustomFeeType(feeType.id, { early_bird: parseFloat(e.target.value) || 0 })}
                                  min="0"
                                  step="0.01"
                                  placeholder="npr. 300.00"
                                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                                <p className="mt-1 text-xs text-purple-600">
                                  Price during early bird period
                                </p>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-purple-900 mb-1">
                                  Regular
                                </label>
                                <input
                                  type="number"
                                  value={feeType.regular}
                                  onChange={(e) => updateCustomFeeType(feeType.id, { regular: parseFloat(e.target.value) || 0 })}
                                  min="0"
                                  step="0.01"
                                  placeholder="npr. 400.00"
                                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                                <p className="mt-1 text-xs text-purple-600">
                                  Default price after early bird
                                </p>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-purple-900 mb-1">
                                  Late
                                </label>
                                <input
                                  type="number"
                                  value={feeType.late}
                                  onChange={(e) => updateCustomFeeType(feeType.id, { late: parseFloat(e.target.value) || 0 })}
                                  min="0"
                                  step="0.01"
                                  placeholder="npr. 500.00"
                                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                                <p className="mt-1 text-xs text-purple-600">
                                  Price for late registration
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="accompanying_person_price" className="block text-sm font-semibold text-gray-700 mb-2">
                Accompanying Person Price
              </label>
              <input
                type="number"
                id="accompanying_person_price"
                name="accompanying_person_price"
                value={formData.accompanying_person_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-gray-500">
                Price for each accompanying person. This price applies to all pricing tiers (early bird, regular, late).
              </p>
            </div>
          </div>

          {/* Custom Pricing Fields */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Custom Pricing Fields</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add custom pricing fields with your own labels and descriptions
                </p>
              </div>
              <button
                type="button"
                onClick={addCustomPricingField}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </button>
            </div>

            {formData.custom_pricing_fields.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-dashed border-blue-200">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold text-sm mb-1">No custom pricing fields yet</p>
                <p className="text-gray-500 text-xs">Click "Add Field" to create your first custom pricing field</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.custom_pricing_fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Custom Field #{index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeCustomPricingField(field.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Remove field"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Field Name *
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            updateCustomPricingField(field.id, { name: e.target.value })
                          }
                          placeholder="e.g., VIP Price, Group Discount"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Value (Price) *
                        </label>
                        <input
                          type="number"
                          value={field.value}
                          onChange={(e) =>
                            updateCustomPricingField(field.id, {
                              value: parseFloat(e.target.value) || 0,
                            })
                          }
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={field.description}
                        onChange={(e) =>
                          updateCustomPricingField(field.id, { description: e.target.value })
                        }
                        placeholder="Describe what this pricing field represents (e.g., 'Special price for VIP members', 'Group discount for 5+ participants')"
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Preview */}
                    {field.name && field.value > 0 && (
                      <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {field.name}: {field.value.toFixed(2)} {formData.currency}
                        </p>
                        {field.description && (
                          <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hotel Options for Accommodation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hotel Options</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add available hotels and room types for accommodation booking
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {hotelOptions.length} hotel option(s) configured
            </div>
            <button
              type="button"
              onClick={addHotelOption}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Hotel
            </button>
          </div>

          {hotelOptions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">No hotel options yet</p>
              <p className="text-gray-400 text-xs mt-1">Click "Add Hotel" to create your first hotel option</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hotelOptions.map((hotel, index) => {
                const isExpanded = expandedHotelId === hotel.id
                return (
                  <div
                    key={hotel.id}
                    draggable
                    onDragStart={() => handleHotelDragStart(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleHotelDrop(index)}
                    className={`bg-white rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${
                      draggedHotelIndex === index 
                        ? 'opacity-50 border-green-300 shadow-xl scale-105' 
                        : isExpanded
                          ? 'border-green-500 shadow-lg'
                          : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    {/* Header - Always Visible */}
                    <div
                      onClick={() => setExpandedHotelId(isExpanded ? null : hotel.id)}
                      className="p-4 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                          title="Drag to reorder"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {hotel.name || `Hotel #${index + 1}`}
                          </h4>
                          {hotel.name && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>{hotel.occupancy}</span>
                              <span>•</span>
                              <span>{formatPriceWithoutZeros(hotel.pricePerNight)} {formData.currency}/night</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeHotelOption(hotel.id)
                          }}
                          className="text-red-600 hover:text-red-700 transition-colors p-1"
                          title="Remove hotel"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                          {isExpanded ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Hotel Name & Room Type *
                          </label>
                          <input
                            type="text"
                            value={hotel.name}
                            onChange={(e) =>
                              updateHotelOption(hotel.id, { name: e.target.value })
                            }
                            placeholder="Hotel Name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Occupancy *
                            </label>
                            <select
                              value={hotel.occupancy}
                              onChange={(e) =>
                                updateHotelOption(hotel.id, { occupancy: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              required
                            >
                              <option value="1 person">1 person</option>
                              <option value="2 people">2 people</option>
                              <option value="3 people">3 people</option>
                              <option value="4 people">4 people</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Price Per Night ({formData.currency}) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-gray-500 font-medium">
                                {formData.currency}
                              </span>
                              <input
                                type="number"
                                value={hotel.pricePerNight || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  // Remove leading zeros and parse
                                  const numValue = value === '' ? 0 : parseFloat(value.replace(/^0+/, '')) || 0
                                  updateHotelOption(hotel.id, {
                                    pricePerNight: numValue,
                                  })
                                }}
                                onFocus={(e) => e.target.select()}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description (Optional)
                          </label>
                          <textarea
                            value={hotel.description || ''}
                            onChange={(e) =>
                              updateHotelOption(hotel.id, { description: e.target.value })
                            }
                            placeholder="Additional information"
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        {/* Availability Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Available From (Optional)
                            </label>
                            <input
                              type="date"
                              value={hotel.available_from || ''}
                              onChange={(e) =>
                                updateHotelOption(hotel.id, { available_from: e.target.value || undefined })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Start date"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave empty to make available from conference start date
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Available Until (Optional)
                            </label>
                            <input
                              type="date"
                              value={hotel.available_until || ''}
                              onChange={(e) =>
                                updateHotelOption(hotel.id, { available_until: e.target.value || undefined })
                              }
                              min={hotel.available_from || undefined}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="End date"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave empty to make available until conference end date
                            </p>
                          </div>
                        </div>

                        {/* Max Rooms (Optional) */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Maximum Rooms Available (Optional)
                          </label>
                          <input
                            type="number"
                            value={hotel.max_rooms || ''}
                            onChange={(e) =>
                              updateHotelOption(hotel.id, {
                                max_rooms: e.target.value ? parseInt(e.target.value) : undefined,
                              })
                            }
                            min="1"
                            placeholder="Leave empty for unlimited"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Set maximum number of rooms available for booking (optional)
                          </p>
                        </div>

                        {/* Preview */}
                        {hotel.name && hotel.pricePerNight > 0 && (
                          <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                            <p className="text-xs text-gray-500 mb-1">Preview:</p>
                            <p className="text-sm font-semibold text-gray-900">🏨 {hotel.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                              <span>👤 {hotel.occupancy}</span>
                              <span>💶 {hotel.pricePerNight.toFixed(2)} {formData.currency}/night</span>
                            </div>
                            {hotel.description && (
                              <p className="text-xs text-gray-600 mt-1">{hotel.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Abstract Information Text */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Abstract Information</h2>
            <p className="text-sm text-gray-600">
              Add introductory text or instructions that will appear at the top of the abstract submission form.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Information Text
            </label>
            <textarea
              value={abstractInfoText}
              onChange={(e) => setAbstractInfoText(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Enter information text that will be displayed to users when they submit abstracts. For example: guidelines, requirements, deadlines, etc."
            />
            <p className="text-xs text-gray-500 mt-2">
              This text will be displayed at the beginning of the abstract submission form
            </p>
          </div>
        </div>

        {/* Custom Abstract Submission Fields */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-purple-100 p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Custom Abstract Submission Fields</h2>
            </div>
            <p className="text-sm text-gray-600 ml-13">
              Add custom fields to the abstract submission form. Users will see and fill these fields when submitting abstracts.
            </p>
          </div>

          <div className="flex items-center justify-between mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-purple-900">
                {formData.custom_abstract_fields.length} field(s) configured
              </span>
              {formData.custom_abstract_fields.length > 0 && (
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addCustomAbstractSeparator}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium shadow-md hover:shadow-lg"
                title="Add section separator for multiple authors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Add Separator
              </button>
              <button
                type="button"
                onClick={addCustomAbstractField}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </button>
            </div>
          </div>

          {formData.custom_abstract_fields.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-dashed border-purple-200">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-700 font-semibold text-sm mb-1">No custom abstract fields yet</p>
              <p className="text-gray-500 text-xs">Click "Add Field" to create your first custom abstract field</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.custom_abstract_fields.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleAbstractDragStart(index)}
                  onDragOver={(e) => handleAbstractDragOver(e, index)}
                  onDragEnd={handleAbstractDragEnd}
                  className={`transition-all duration-200 ${
                    draggedAbstractFieldIndex === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <CollapsibleFieldEditor
                    field={field}
                    index={index}
                    onUpdate={updateCustomAbstractField}
                    onRemove={removeCustomAbstractField}
                    isExpanded={expandedAbstractFieldId === field.id}
                    onToggleExpand={() => setExpandedAbstractFieldId(expandedAbstractFieldId === field.id ? null : field.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Email Settings</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="from_email" className="block text-sm font-semibold text-gray-700 mb-2">
                From Email
              </label>
              <input
                type="email"
                id="from_email"
                name="from_email"
                value={formData.from_email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="conference@yourorganization.com"
              />
            </div>

            <div>
              <label htmlFor="from_name" className="block text-sm font-semibold text-gray-700 mb-2">
                From Name
              </label>
              <input
                type="text"
                id="from_name"
                name="from_name"
                value={formData.from_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Conference Team"
              />
            </div>

            <div>
              <label htmlFor="reply_to" className="block text-sm font-semibold text-gray-700 mb-2">
                Reply-To Email
              </label>
              <input
                type="email"
                id="reply_to"
                name="reply_to"
                value={formData.reply_to}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="support@yourorganization.com"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-200">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
              {deleting ? 'Deleting...' : 'Delete Conference'}
            </button>
          )}

          <div className={`flex items-center gap-4 ${!isSuperAdmin ? 'ml-auto' : ''}`}>
            <Link
              href="/admin/conferences"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

