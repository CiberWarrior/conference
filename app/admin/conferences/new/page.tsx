'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useConference } from '@/contexts/ConferenceContext'
import { ArrowLeft, Calendar, MapPin, Globe, DollarSign, Save } from 'lucide-react'
import Link from 'next/link'
import { showSuccess, showError } from '@/utils/toast'
import { showSuccess, showError } from '@/utils/toast'

export default function NewConferencePage() {
  const router = useRouter()
  const { refreshConferences } = useConference()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    venue: '',
    website_url: '',
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
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/conferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
          location: formData.location || undefined,
          venue: formData.venue || undefined,
          website_url: formData.website_url || undefined,
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
            timezone: 'Europe/Zagreb',
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await refreshConferences()
        router.push('/admin/conferences')
      } else {
        showSuccess(`Failed to create conference: ${data.error}`)
      }
    } catch (error) {
      showError('An error occurred while creating the conference')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/conferences"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Conferences
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Conference</h1>
        <p className="text-gray-600 mt-2">Set up a new conference event</p>
      </div>

      {/* Form */}
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
                placeholder="e.g., International Tech Conference 2024"
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
                placeholder="Brief description of your conference..."
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
                placeholder="https://yourconference.com"
              />
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Event Details
          </h2>

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
                Location (City/Country)
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Zagreb, Croatia"
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
                placeholder="e.g., Grand Hotel Conference Center"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Pricing
          </h2>

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

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Conference Settings</h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="registration_enabled"
                checked={formData.registration_enabled}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-gray-900">Enable Registration</p>
                <p className="text-sm text-gray-600">Allow participants to register for the conference</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="abstract_submission_enabled"
                checked={formData.abstract_submission_enabled}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-gray-900">Enable Abstract Submission</p>
                <p className="text-sm text-gray-600">Allow participants to submit abstracts</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="payment_required"
                checked={formData.payment_required}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-gray-900">Require Payment</p>
                <p className="text-sm text-gray-600">Participants must pay registration fee</p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6">
          <Link
            href="/admin/conferences"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Conference
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

