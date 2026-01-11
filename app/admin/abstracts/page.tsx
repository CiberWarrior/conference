'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import { showSuccess, showError } from '@/utils/toast'
import {
  Download,
  FileText,
  Search,
  Filter,
  Calendar,
  Mail,
  User,
  X,
} from 'lucide-react'

interface Abstract {
  id: string
  file_name: string
  file_path: string
  file_size: number
  email: string | null
  uploaded_at: string
  conference_id: string | null
  registration_id: string | null
  custom_data: Record<string, any> | null
  conference?: {
    id: string
    name: string
    slug: string
  }
}

export default function AbstractsPage() {
  const { currentConference, conferences, loading: conferenceLoading } =
    useConference()
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConferenceId, setSelectedConferenceId] = useState<
    string | 'all'
  >('all')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    loadAbstracts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConference, selectedConferenceId])

  // Auto-select current conference if available
  useEffect(() => {
    if (currentConference && selectedConferenceId === 'all') {
      setSelectedConferenceId(currentConference.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConference])

  const loadAbstracts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('abstracts')
        .select('*, conferences(id, name, slug)')
        .order('uploaded_at', { ascending: false })

      // Filter by conference if selected
      if (selectedConferenceId !== 'all') {
        query = query.eq('conference_id', selectedConferenceId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setAbstracts(
        (data || []).map((a: any) => ({
          id: a.id,
          file_name: a.file_name,
          file_path: a.file_path,
          file_size: a.file_size,
          email: a.email,
          uploaded_at: a.uploaded_at,
          conference_id: a.conference_id,
          registration_id: a.registration_id,
          custom_data: a.custom_data || {},
          conference: a.conferences
            ? {
                id: a.conferences.id,
                name: a.conferences.name,
                slug: a.conferences.slug,
              }
            : undefined,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load abstracts')
      showError('Failed to load abstracts')
    } finally {
      setLoading(false)
    }
  }

  const downloadAbstract = async (abstract: Abstract) => {
    try {
      setDownloadingId(abstract.id)

      // Get signed URL for download
      const { data, error: urlError } = await supabase.storage
        .from('abstracts')
        .createSignedUrl(abstract.file_path, 3600) // 1 hour expiry

      if (urlError) throw urlError

      if (data?.signedUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = abstract.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showSuccess('Abstract downloaded successfully')
      } else {
        throw new Error('Failed to generate download URL')
      }
    } catch (err) {
      console.error('Download error:', err)
      showError(
        'Failed to download abstract: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      )
    } finally {
      setDownloadingId(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Filter abstracts based on search
  const filteredAbstracts = abstracts.filter((abstract) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      abstract.file_name.toLowerCase().includes(searchLower) ||
      (abstract.email && abstract.email.toLowerCase().includes(searchLower)) ||
      (abstract.conference &&
        abstract.conference.name.toLowerCase().includes(searchLower)) ||
      (abstract.custom_data &&
        JSON.stringify(abstract.custom_data)
          .toLowerCase()
          .includes(searchLower))
    )
  })

  if (loading && abstracts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading abstracts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Abstract Submission
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage submitted abstracts
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by file name, email, or conference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Conference Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedConferenceId}
              onChange={(e) => setSelectedConferenceId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Conferences</option>
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Abstracts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {abstracts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filteredAbstracts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Conference</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {currentConference?.name || 'None selected'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Abstracts List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {filteredAbstracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No abstracts found
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedConferenceId !== 'all'
              ? 'Try adjusting your filters'
              : 'No abstracts have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAbstracts.map((abstract) => (
                  <tr key={abstract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {abstract.file_name}
                          </div>
                          {abstract.custom_data &&
                            Object.keys(abstract.custom_data).length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {Object.entries(abstract.custom_data)
                                  .slice(0, 2)
                                  .map(([key, value]) => (
                                    <span key={key} className="mr-2">
                                      <strong>{key}:</strong> {String(value)}
                                    </span>
                                  ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {abstract.conference?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        {abstract.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(abstract.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(abstract.uploaded_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => downloadAbstract(abstract)}
                        disabled={downloadingId === abstract.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingId === abstract.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
