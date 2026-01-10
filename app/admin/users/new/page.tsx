'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface Conference {
  id: string
  name: string
}

export default function NewUserPage() {
  const router = useRouter()
  const { isSuperAdmin, loading: authLoading } = useAuth()
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  
  // Conferences and permissions
  const [conferences, setConferences] = useState<Conference[]>([])
  const [selectedConferences, setSelectedConferences] = useState<string[]>([])
  const [permissions, setPermissions] = useState({
    can_view_registrations: true,
    can_export_data: true,
    can_manage_payments: true,
    can_manage_abstracts: true,
    can_check_in: true,
    can_generate_certificates: true,
    can_edit_conference: false,
    can_delete_data: false,
    can_manage_registration_form: true,
    can_view_all_registrations: true,
    can_view_analytics: true,
  })
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [loadingConferences, setLoadingConferences] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/admin/dashboard')
    } else if (isSuperAdmin) {
      loadConferences()
    }
  }, [isSuperAdmin, authLoading, router])

  const loadConferences = async () => {
    try {
      const response = await fetch('/api/admin/conferences')
      const data = await response.json()

      if (response.ok) {
        setConferences(data.conferences || [])
      }
    } catch (error) {
      console.error('Error loading conferences:', error)
    } finally {
      setLoadingConferences(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!email || !password || !fullName) {
      setError('Email, password, and full name are required')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (selectedConferences.length === 0) {
      setError('Please select at least one conference')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone: phone || undefined,
          organization: organization || undefined,
          role: 'conference_admin',
          conference_ids: selectedConferences,
          permissions
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/admin/users')
        }, 2000)
      } else {
        setError(data.error || 'Failed to create user')
        setLoading(false)
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const toggleConference = (conferenceId: string) => {
    setSelectedConferences(prev =>
      prev.includes(conferenceId)
        ? prev.filter(id => id !== conferenceId)
        : [...prev, conferenceId]
    )
  }

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (authLoading || loadingConferences) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return null
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">User Created Successfully!</h2>
          <p className="text-gray-600 mb-6">
            The new Conference Admin has been created and assigned to the selected conferences.
          </p>
          <p className="text-sm text-gray-500">Redirecting to users list...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-blue-600" />
          Add New Conference Admin
        </h1>
        <p className="text-gray-600 mt-2">Create a new Conference Admin user and assign conferences</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min. 8 characters"
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Corporation"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Assign Conferences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Assign Conferences <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Select which conferences this user can manage
          </p>

          {conferences.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600">No conferences available</p>
              <p className="text-sm text-gray-500 mt-1">Create a conference first</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conferences.map((conference) => (
                <label
                  key={conference.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedConferences.includes(conference.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedConferences.includes(conference.id)}
                    onChange={() => toggleConference(conference.id)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">{conference.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Permissions</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set what this user can do in their assigned conferences
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'can_view_registrations', label: 'View Registrations', description: 'Can view participant registrations' },
              { key: 'can_export_data', label: 'Export Data', description: 'Can export data to Excel/CSV' },
              { key: 'can_manage_payments', label: 'Manage Payments', description: 'Can view and update payment status' },
              { key: 'can_manage_abstracts', label: 'Manage Abstracts', description: 'Can review and manage abstracts' },
              { key: 'can_check_in', label: 'Check-in Participants', description: 'Can check-in attendees' },
              { key: 'can_generate_certificates', label: 'Generate Certificates', description: 'Can create and issue certificates' },
              { key: 'can_manage_registration_form', label: 'Manage Registration Form', description: 'Can create and edit custom registration fields' },
              { key: 'can_view_all_registrations', label: 'View All Registrations', description: 'Full access to all registration data' },
              { key: 'can_view_analytics', label: 'View Analytics', description: 'Can view conference statistics and analytics' },
              { key: 'can_edit_conference', label: 'Edit Conference Settings', description: 'Can modify conference details' },
              { key: 'can_delete_data', label: 'Delete Data', description: 'Can delete registrations and data' },
            ].map((perm) => (
              <label
                key={perm.key}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  permissions[perm.key as keyof typeof permissions]
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={permissions[perm.key as keyof typeof permissions]}
                  onChange={() => togglePermission(perm.key as keyof typeof permissions)}
                  className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-2 focus:ring-green-500 mt-0.5"
                />
                <div>
                  <span className="block font-medium text-gray-900">{perm.label}</span>
                  <span className="block text-sm text-gray-600">{perm.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/users"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Create Conference Admin</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

