'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useConference } from '@/contexts/ConferenceContext'
import { ArrowLeft, Save, Trash2, Upload, Globe, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import type { Conference } from '@/types/conference'

export default function ConferenceSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const { refreshConferences } = useConference()
  const conferenceId = params.id as string

  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    venue: '',
    website_url: '',
    primary_color: '#3B82F6',
    // Pricing
    currency: 'EUR',
    early_bird_amount: 150,
    early_bird_deadline: '',
    regular_amount: 200,
    late_amount: 250,
    student_discount: 50,
    // Settings
    registration_enabled: true,
    abstract_submission_enabled: true,
    payment_required: true,
    max_registrations: '',
    timezone: 'Europe/Zagreb',
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
  }, [conferenceId])

  const loadConference = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/conferences/${conferenceId}`)
      const data = await response.json()

      if (response.ok && data.conference) {
        const conf = data.conference
        setConference(conf)
        
        setFormData({
          name: conf.name || '',
          description: conf.description || '',
          start_date: conf.start_date || '',
          end_date: conf.end_date || '',
          location: conf.location || '',
          venue: conf.venue || '',
          website_url: conf.website_url || '',
          primary_color: conf.primary_color || '#3B82F6',
          // Pricing
          currency: conf.pricing?.currency || 'EUR',
          early_bird_amount: conf.pricing?.early_bird?.amount || 150,
          early_bird_deadline: conf.pricing?.early_bird?.deadline || '',
          regular_amount: conf.pricing?.regular?.amount || 200,
          late_amount: conf.pricing?.late?.amount || 250,
          student_discount: conf.pricing?.student_discount || 50,
          // Settings
          registration_enabled: conf.settings?.registration_enabled ?? true,
          abstract_submission_enabled: conf.settings?.abstract_submission_enabled ?? true,
          payment_required: conf.settings?.payment_required ?? true,
          max_registrations: conf.settings?.max_registrations?.toString() || '',
          timezone: conf.settings?.timezone || 'Europe/Zagreb',
          // Email
          from_email: conf.email_settings?.from_email || '',
          from_name: conf.email_settings?.from_name || '',
          reply_to: conf.email_settings?.reply_to || '',
          // Status
          published: conf.published || false,
          active: conf.active ?? true,
        })
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
          primary_color: formData.primary_color,
          pricing: {
            currency: formData.currency,
            early_bird: {
              amount: formData.early_bird_amount,
              deadline: formData.early_bird_deadline || undefined,
            },
            regular: {
              amount: formData.regular_amount,
            },
            late: {
              amount: formData.late_amount,
            },
            student_discount: formData.student_discount,
          },
          settings: {
            registration_enabled: formData.registration_enabled,
            abstract_submission_enabled: formData.abstract_submission_enabled,
            payment_required: formData.payment_required,
            max_registrations: formData.max_registrations ? parseInt(formData.max_registrations) : null,
            timezone: formData.timezone,
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
        alert('Conference settings saved successfully!')
      } else {
        alert(`Failed to save: ${data.error}`)
      }
    } catch (error) {
      alert('An error occurred while saving')
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
        router.push('/admin/conferences')
      } else {
        const data = await response.json()
        alert(`Failed to delete: ${data.error}`)
      }
    } catch (error) {
      alert('An error occurred while deleting')
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
          </div>
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing</h2>

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
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="HRK">HRK (kn)</option>
              </select>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="student_discount" className="block text-sm font-semibold text-gray-700 mb-2">
                Student Discount
              </label>
              <input
                type="number"
                id="student_discount"
                name="student_discount"
                value={formData.student_discount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="abstract_submission_enabled"
                checked={formData.abstract_submission_enabled}
                onChange={handleChange}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-gray-900">Enable Abstract Submission</p>
                <p className="text-sm text-gray-600">Allow participants to submit abstracts</p>
              </div>
            </label>

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
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            {deleting ? 'Deleting...' : 'Delete Conference'}
          </button>

          <div className="flex items-center gap-4">
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

