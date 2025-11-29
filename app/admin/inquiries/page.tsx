'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  Search,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
  Info,
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface ContactInquiry {
  id: string
  name: string
  email: string
  organization: string
  phone: string | null
  conference_type: string | null
  expected_attendees: string | null
  message: string
  status: string
  priority: string
  assigned_to: string | null
  notes: string | null
  follow_up_date: string | null
  converted: boolean
  converted_to_conference_id: string | null
  source: string
  created_at: string
  updated_at: string
  contacted_at: string | null
  converted_at: string | null
}

interface InquiryStats {
  total_inquiries: number
  new_inquiries: number
  contacted_inquiries: number
  qualified_inquiries: number
  converted_inquiries: number
  inquiries_last_7_days: number
  inquiries_last_30_days: number
  virtual_conference_requests: number
  hybrid_conference_requests: number
  onsite_conference_requests: number
  avg_response_time_hours: number
  conversion_rate_percent: number
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([])
  const [stats, setStats] = useState<InquiryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateData, setUpdateData] = useState({
    status: '',
    priority: '',
    notes: '',
    follow_up_date: '',
  })
  const [processing, setProcessing] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  useEffect(() => {
    loadInquiries()
    loadStats()
  }, [])

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.export-dropdown')) {
        setExportMenuOpen(false)
      }
    }
    
    if (exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [exportMenuOpen])

  const loadInquiries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInquiries(data || [])
    } catch (error) {
      console.error('Error loading inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_inquiry_stats')
        .select('*')
        .single()

      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleOpenDetails = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry)
    setDetailsModalOpen(true)
  }

  const handleOpenUpdate = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry)
    setUpdateData({
      status: inquiry.status,
      priority: inquiry.priority,
      notes: inquiry.notes || '',
      follow_up_date: inquiry.follow_up_date?.split('T')[0] || '',
    })
    setUpdateModalOpen(true)
  }

  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return

    try {
      setProcessing(true)
      const updates: any = {
        status: updateData.status,
        priority: updateData.priority,
        notes: updateData.notes || null,
        follow_up_date: updateData.follow_up_date || null,
      }

      // If status changed to 'contacted', set contacted_at
      if (updateData.status === 'contacted' && selectedInquiry.status !== 'contacted') {
        updates.contacted_at = new Date().toISOString()
      }

      // If status changed to 'converted', set converted flags
      if (updateData.status === 'converted' && !selectedInquiry.converted) {
        updates.converted = true
        updates.converted_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('contact_inquiries')
        .update(updates)
        .eq('id', selectedInquiry.id)

      if (error) throw error

      await loadInquiries()
      await loadStats()
      setUpdateModalOpen(false)
      setSelectedInquiry(null)
    } catch (error) {
      console.error('Error updating inquiry:', error)
      alert('Failed to update inquiry')
    } finally {
      setProcessing(false)
    }
  }

  const prepareExportData = () => {
    return filteredInquiries.map((inquiry) => ({
      'Date': new Date(inquiry.created_at).toLocaleDateString(),
      'Time': new Date(inquiry.created_at).toLocaleTimeString(),
      'Name': inquiry.name,
      'Email': inquiry.email,
      'Organization': inquiry.organization,
      'Phone': inquiry.phone || '',
      'Conference Type': formatConferenceType(inquiry.conference_type),
      'Expected Attendees': inquiry.expected_attendees || '',
      'Message': inquiry.message,
      'Status': inquiry.status.replace('_', ' ').toUpperCase(),
      'Priority': inquiry.priority.toUpperCase(),
      'Converted': inquiry.converted ? 'Yes' : 'No',
      'Notes': inquiry.notes || '',
    }))
  }

  const exportToExcel = () => {
    const exportData = prepareExportData()
    const ws = XLSX.utils.json_to_sheet(exportData)
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 10 }, // Time
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 25 }, // Organization
      { wch: 15 }, // Phone
      { wch: 18 }, // Conference Type
      { wch: 18 }, // Expected Attendees
      { wch: 40 }, // Message
      { wch: 15 }, // Status
      { wch: 10 }, // Priority
      { wch: 10 }, // Converted
      { wch: 30 }, // Notes
    ]
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inquiries')
    XLSX.writeFile(wb, `inquiries_${new Date().toISOString().split('T')[0]}.xlsx`)
    setExportMenuOpen(false)
  }

  const exportToCSV = () => {
    const exportData = prepareExportData()
    const ws = XLSX.utils.json_to_sheet(exportData)
    const csv = XLSX.utils.sheet_to_csv(ws)
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inquiries_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setExportMenuOpen(false)
  }

  const exportToJSON = () => {
    const exportData = filteredInquiries.map((inquiry) => ({
      id: inquiry.id,
      date: inquiry.created_at,
      name: inquiry.name,
      email: inquiry.email,
      organization: inquiry.organization,
      phone: inquiry.phone,
      conferenceType: inquiry.conference_type,
      expectedAttendees: inquiry.expected_attendees,
      message: inquiry.message,
      status: inquiry.status,
      priority: inquiry.priority,
      converted: inquiry.converted,
      notes: inquiry.notes,
      followUpDate: inquiry.follow_up_date,
      contactedAt: inquiry.contacted_at,
      convertedAt: inquiry.converted_at,
    }))

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inquiries_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setExportMenuOpen(false)
  }

  const copyToClipboard = async () => {
    const exportData = prepareExportData()
    
    // Create tab-separated values for easy paste into spreadsheets
    const headers = Object.keys(exportData[0]).join('\t')
    const rows = exportData.map(row => Object.values(row).join('\t')).join('\n')
    const tsvData = `${headers}\n${rows}`

    try {
      await navigator.clipboard.writeText(tsvData)
      alert('✅ Data copied to clipboard! You can now paste it into Google Sheets or Excel.')
      setExportMenuOpen(false)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('❌ Failed to copy to clipboard. Please try another export method.')
    }
  }

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      searchTerm === '' ||
      inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.organization.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || inquiry.status === filterStatus
    const matchesPriority = filterPriority === 'all' || inquiry.priority === filterPriority

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-4 h-4" />
      case 'contacted':
        return <Mail className="w-4 h-4" />
      case 'qualified':
        return <CheckCircle className="w-4 h-4" />
      case 'converted':
        return <Star className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'qualified':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'converted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Contact Inquiries</h2>
        <p className="mt-2 text-gray-600">Track and manage sales leads from your website</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_inquiries}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {stats.inquiries_last_7_days} in last 7 days
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Inquiries</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.new_inquiries}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Awaiting response</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.conversion_rate_percent || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {stats.converted_inquiries} converted
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.avg_response_time_hours?.toFixed(1) || 0}h
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Average response</p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="negotiating">Negotiating</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Export Dropdown */}
          <div className="relative export-dropdown">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4" />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <button
                  onClick={exportToExcel}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Excel (.xlsx)</p>
                    <p className="text-xs text-gray-500">Download Excel file</p>
                  </div>
                </button>

                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">CSV (.csv)</p>
                    <p className="text-xs text-gray-500">Comma-separated values</p>
                  </div>
                </button>

                <button
                  onClick={exportToJSON}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">JSON (.json)</p>
                    <p className="text-xs text-gray-500">For developers</p>
                  </div>
                </button>

                <button
                  onClick={copyToClipboard}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Copy to Clipboard</p>
                    <p className="text-xs text-gray-500">Paste to Google Sheets</p>
                  </div>
                </button>

                <div className="border-t border-gray-200 mt-2 pt-2 px-4 py-2">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    {filteredInquiries.length} inquiries will be exported
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No inquiries found
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{inquiry.name}</p>
                        <p className="text-sm text-gray-500">{inquiry.email}</p>
                        {inquiry.phone && (
                          <p className="text-sm text-gray-500">{inquiry.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{inquiry.organization}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {inquiry.conference_type && (
                          <p>{formatConferenceType(inquiry.conference_type)}</p>
                        )}
                        {inquiry.expected_attendees && (
                          <p>{inquiry.expected_attendees}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          inquiry.status
                        )}`}
                      >
                        {getStatusIcon(inquiry.status)}
                        {inquiry.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(
                          inquiry.priority
                        )}`}
                      >
                        {inquiry.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenDetails(inquiry)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenUpdate(inquiry)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {detailsModalOpen && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Inquiry Details</h3>
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{selectedInquiry.name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {selectedInquiry.email}
                </a>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Organization
                </label>
                <p className="text-gray-900">{selectedInquiry.organization}</p>
              </div>
              {selectedInquiry.phone && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {selectedInquiry.phone}
                  </a>
                </div>
              )}
              {selectedInquiry.conference_type && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Conference Type
                  </label>
                  <p className="text-gray-900">
                    {formatConferenceType(selectedInquiry.conference_type)}
                  </p>
                </div>
              )}
              {selectedInquiry.expected_attendees && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Expected Attendees
                  </label>
                  <p className="text-gray-900">{selectedInquiry.expected_attendees}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedInquiry.message}
                </p>
              </div>
              {selectedInquiry.notes && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Internal Notes
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    {selectedInquiry.notes}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      selectedInquiry.status
                    )}`}
                  >
                    {getStatusIcon(selectedInquiry.status)}
                    {selectedInquiry.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Priority
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(
                      selectedInquiry.priority
                    )}`}
                  >
                    {selectedInquiry.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Submitted
                </label>
                <p className="text-gray-900">
                  {new Date(selectedInquiry.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDetailsModalOpen(false)
                  handleOpenUpdate(selectedInquiry)
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updateModalOpen && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Update Inquiry</h3>
                <button
                  onClick={() => setUpdateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="converted">Converted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                <select
                  value={updateData.priority}
                  onChange={(e) => setUpdateData({ ...updateData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={updateData.follow_up_date}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, follow_up_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Internal Notes
                </label>
                <textarea
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add internal notes about this inquiry..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setUpdateModalOpen(false)}
                disabled={processing}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInquiry}
                disabled={processing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Update Inquiry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatConferenceType(type: string | null): string {
  if (!type) return ''
  const types: Record<string, string> = {
    virtual: 'Virtual Conference',
    hybrid: 'Hybrid Conference',
    onsite: 'On-site Conference',
    other: 'Other',
  }
  return types[type] || type
}

