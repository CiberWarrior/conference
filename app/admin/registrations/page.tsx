'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import type { Registration } from '@/types/registration'
import * as XLSX from 'xlsx'
import { QRCodeSVG } from 'qrcode.react'
import { showSuccess, showError, showInfo } from '@/utils/toast'

// Force dynamic rendering for this page (uses searchParams)
export const dynamic = 'force-dynamic'

function RegistrationsPageContent() {
  const searchParams = useSearchParams()
  const { currentConference, conferences, setCurrentConference, loading: conferenceLoading } = useConference()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionMenuOpen, setBulkActionMenuOpen] = useState(false)
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false)
  const [bulkEmailType, setBulkEmailType] = useState<'payment_reminder' | 'pre_conference_reminder' | 'event_details'>('payment_reminder')
  const [bulkEmailData, setBulkEmailData] = useState({
    customMessage: '',
    conferenceDate: '',
    conferenceLocation: '',
    conferenceProgram: '',
  })
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedQRRegistration, setSelectedQRRegistration] = useState<Registration | null>(null)

  // Handle conference query parameter - set conference from URL if provided
  useEffect(() => {
    const conferenceId = searchParams?.get('conference')
    if (conferenceId && conferences.length > 0) {
      const conference = conferences.find((c) => c.id === conferenceId)
      if (conference && conference.id !== currentConference?.id) {
        setCurrentConference(conference)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conferences])

  useEffect(() => {
    if (currentConference) {
      loadRegistrations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConference])

  const loadRegistrations = async () => {
    if (!currentConference) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('registrations')
        .select(`
          *,
          participant_profiles (
            phone,
            country,
            institution
          )
        `)
        .eq('conference_id', currentConference.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setRegistrations(
        data.map((r) => {
          // Helper: Extract data from participants[0].customFields if available
          const firstParticipant = r.participants?.[0]?.customFields || {}
          const customData = r.custom_data || {}
          // participant_profiles is returned as object, not array
          const participantProfile = r.participant_profiles || null
          
          // Helper function to find field value by common names
          const findField = (possibleNames: string[], profileField?: string) => {
            // Check participant_profiles first (if field specified and profile exists)
            if (profileField && participantProfile && participantProfile[profileField]) {
              return participantProfile[profileField]
            }
            // Check participants array
            for (const name of possibleNames) {
              if (firstParticipant[name]) return firstParticipant[name]
            }
            // Then check custom_data
            for (const name of possibleNames) {
              if (customData[name]) return customData[name]
            }
            return ''
          }

          return {
            id: r.id,
            registration_number: r.registration_number || undefined,
            firstName: r.first_name || findField(['First Name', 'FIRST NAME', 'FirstName', 'first_name', 'Name', 'NAME']),
            lastName: r.last_name || findField(['Last Name', 'LAST NAME', 'LastName', 'last_name', 'SURNAME', 'Surname']),
            email: r.email || findField(['EMAIL', 'Email', 'email', 'E-mail']),
            phone: r.phone || findField(['Phone Number', 'PHONE', 'Phone', 'phone', 'Telephone', 'Mobile', 'Mobile Number', 'Contact Number', 'Tel'], 'phone'),
            country: r.country || findField(['COUNTRY', 'Country', 'country'], 'country'),
            institution: r.institution || findField(['INSTITUTION', 'Institution', 'institution', 'ORGANIZATION', 'Organization', 'Company'], 'institution'),
            arrivalDate: r.arrival_date || findField(['Arrival Date', 'arrival_date', 'Check In']),
            departureDate: r.departure_date || findField(['Departure Date', 'departure_date', 'Check Out']),
            paymentRequired: r.payment_required,
            paymentByCard: r.payment_by_card || false,
            accompanyingPersons: r.accompanying_persons || false,
            accompanyingPersonsData: r.accompanying_persons_data || [],
            galaDinner: r.gala_dinner || false,
            presentationType: r.presentation_type || false,
            abstractSubmission: r.abstract_submission || false,
            paymentStatus: r.payment_status,
            createdAt: r.created_at,
            checkedIn: r.checked_in || false,
            checkedInAt: r.checked_in_at || null,
            customFields: customData,
            participants: r.participants || [],
          }
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  // Filter registrations based on search and status
  const filteredRegistrations = registrations.filter((reg) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      (reg.firstName || '').toLowerCase().includes(searchLower) ||
      (reg.lastName || '').toLowerCase().includes(searchLower) ||
      (reg.email || '').toLowerCase().includes(searchLower) ||
      (reg.registration_number || '').toLowerCase().includes(searchLower) ||
      (reg.country && reg.country.toLowerCase().includes(searchLower)) ||
      (reg.institution && reg.institution.toLowerCase().includes(searchLower))

    const matchesFilter =
      filterStatus === 'all' || reg.paymentStatus === filterStatus

    return matchesSearch && matchesFilter
  })

  // Helper function to prepare data for export
  const prepareExportData = () => {
    // Get custom field definitions from current conference
    const customFieldDefs = currentConference?.settings?.custom_registration_fields || []
    const participantSettings = currentConference?.settings?.participant_settings
    
    // Standard headers
    const standardHeaders = [
      'Conference',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Country',
      'Institution',
      'Arrival Date',
      'Departure Date',
      'Payment Required',
      'Payment by Card',
      'Payment Status',
      'Checked In',
      'Created At',
    ]
    
    // Add custom field headers
    const customHeaders = customFieldDefs.map(field => field.label)
    
    // Add participant count header if multiple participants are enabled
    const participantHeaders = participantSettings?.enabled 
      ? ['Number of Participants', 'Participant Names', 'Participant Emails'] 
      : []
    
    const headers = [...standardHeaders, ...customHeaders, ...participantHeaders]
    
    const rows = filteredRegistrations.map((r) => {
      const standardData = [
        currentConference?.name || 'N/A',
        r.firstName,
        r.lastName,
        r.email,
        r.phone,
        r.country || '',
        r.institution || '',
        r.arrivalDate || '',
        r.departureDate || '',
        r.paymentRequired ? 'Yes' : 'No',
        r.paymentByCard ? 'Yes' : 'No',
        r.paymentStatus,
        r.checkedIn ? 'Yes' : 'No',
        new Date(r.createdAt).toLocaleString(),
      ]
      
      // Add custom field values
      const customData = customFieldDefs.map(field => {
        const value = r.customFields?.[field.name]
        if (value === undefined || value === null) return ''
        if (typeof value === 'boolean') return value ? 'Yes' : 'No'
        if (Array.isArray(value)) return value.join(', ')
        return String(value)
      })
      
      // Add participant data if enabled
      const participantData = participantSettings?.enabled 
        ? [
            (r.participants?.length || 0).toString(),
            r.participants?.map(p => {
              const firstName = p.customFields?.['firstName'] || p.customFields?.['First Name'] || ''
              const lastName = p.customFields?.['lastName'] || p.customFields?.['Last Name'] || ''
              return `${firstName} ${lastName}`.trim()
            }).join('; ') || '',
            r.participants?.map(p => p.customFields?.['email'] || p.customFields?.['Email'] || '').join('; ') || '',
          ]
        : []
      
      return [...standardData, ...customData, ...participantData]
    })
    
    return { headers, rows }
  }

  // Quick export - only basic contact info (First Name, Last Name, Email, Phone)
  const exportBasicContactsCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone']
    const rows = filteredRegistrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.phone || '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${currentConference?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportMenuOpen(false)
    showSuccess(`Exported ${filteredRegistrations.length} contacts`)
  }

  const exportBasicContactsExcel = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone']
    const rows = filteredRegistrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.phone || '',
    ])

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // First Name
      { wch: 20 }, // Last Name
      { wch: 30 }, // Email
      { wch: 20 }, // Phone
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts')

    // Generate Excel file
    const fileName = `contacts-${currentConference?.name || 'export'}-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    setExportMenuOpen(false)
    showSuccess(`Exported ${filteredRegistrations.length} contacts`)
  }

  const exportToCSV = () => {
    const { headers, rows } = prepareExportData()
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportMenuOpen(false)
  }

  const exportToExcel = () => {
    const { headers, rows } = prepareExportData()
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    
    // Set column widths
    const colWidths = headers.map(() => ({ wch: 20 }))
    ws['!cols'] = colWidths
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations')
    
    // Generate Excel file
    const fileName = `registrations-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    setExportMenuOpen(false)
  }

  const exportToGoogleSheets = () => {
    const { headers, rows } = prepareExportData()
    
    // Create CSV content optimized for Google Sheets
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    // Show instructions
    showInfo(
      'CSV file downloaded! To import into Google Sheets: Open Google Sheets → File → Import → Upload CSV file'
    )
    setExportMenuOpen(false)
  }

  // Bulk operations
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRegistrations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRegistrations.map((r) => r.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkUpdateStatus = async (newStatus: 'paid' | 'pending' | 'not_required') => {
    if (selectedIds.size === 0) return

    try {
      setBulkProcessing(true)
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          registrationIds: Array.from(selectedIds),
          newStatus,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update registrations')
      }

      showSuccess(`Successfully updated ${result.updated} registration(s)`)
      setSelectedIds(new Set())
      setBulkActionMenuOpen(false)
      loadRegistrations()
    } catch (error) {
      showError('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    const confirmMessage = `Are you sure you want to delete ${selectedIds.size} registration(s)? This action cannot be undone.`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setBulkProcessing(true)
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          registrationIds: Array.from(selectedIds),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete registrations')
      }

      showSuccess(`Successfully deleted ${result.deleted} registration(s)`)
      setSelectedIds(new Set())
      setBulkActionMenuOpen(false)
      loadRegistrations()
    } catch (error) {
      showError('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleBulkSendEmail = async () => {
    if (selectedIds.size === 0) return

    try {
      setBulkProcessing(true)
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_email',
          registrationIds: Array.from(selectedIds),
          emailType: bulkEmailType,
          emailData: bulkEmailData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send emails')
      }

      showSuccess(`Sent ${result.sent} email(s), ${result.failed} failed`)
      if (result.errors && result.errors.length > 0) {
        console.error('Email errors:', result.errors)
      }
      setSelectedIds(new Set())
      setBulkEmailModalOpen(false)
      setBulkActionMenuOpen(false)
    } catch (error) {
      showError('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleBulkExport = () => {
    const selectedRegistrations = filteredRegistrations.filter((r) => selectedIds.has(r.id))
    if (selectedRegistrations.length === 0) return

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Country',
      'Institution',
      'Arrival Date',
      'Departure Date',
      'Payment Required',
      'Payment by Card',
      'Payment Status',
      'Created At',
    ]
    const rows = selectedRegistrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.phone,
      r.country || '',
      r.institution || '',
      r.arrivalDate || '',
      r.departureDate || '',
      r.paymentRequired ? 'Yes' : 'No',
      r.paymentByCard ? 'Yes' : 'No',
      r.paymentStatus,
      new Date(r.createdAt).toLocaleString(),
    ])

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = headers.map(() => ({ wch: 20 }))
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Registrations')
    XLSX.writeFile(wb, `selected-registrations-${new Date().toISOString().split('T')[0]}.xlsx`)

    setSelectedIds(new Set())
    setBulkActionMenuOpen(false)
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Registrations</h2>
          <p className="mt-2 text-gray-600">Manage conference registrations</p>
        </div>
        <div className="flex gap-2">
          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-1">
                    {/* Quick Export Section - Basic Contacts Only */}
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                      Quick Export (Basic Info)
                    </div>
                    <button
                      onClick={exportBasicContactsCSV}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3"
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Contacts CSV</div>
                        <div className="text-xs text-gray-500">Name, Email, Phone</div>
                      </div>
                    </button>
                    <button
                      onClick={exportBasicContactsExcel}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-3"
                    >
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Contacts Excel</div>
                        <div className="text-xs text-gray-500">Name, Email, Phone</div>
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="my-1 border-t border-gray-200"></div>

                    {/* Full Export Section - All Data */}
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                      Full Export (All Data)
                    </div>
                    <button
                      onClick={exportToCSV}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export as CSV
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export as Excel (.xlsx)
                    </button>
                    <button
                      onClick={exportToGoogleSheets}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export for Google Sheets
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <a
            href="/api/admin/backup?format=csv"
            download
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Full Backup
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, country, or institution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Payment</option>
              <option value="paid">Paid</option>
              <option value="not_required">Not Required</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} registration(s) selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear selection
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setBulkActionMenuOpen(!bulkActionMenuOpen)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                  disabled={bulkProcessing}
                >
                  Bulk Actions
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {bulkActionMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setBulkActionMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setBulkEmailModalOpen(true)
                            setBulkActionMenuOpen(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Send Email
                        </button>
                        <div className="border-t border-gray-200 my-1" />
                        <button
                          onClick={() => handleBulkUpdateStatus('paid')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          disabled={bulkProcessing}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark as Paid
                        </button>
                        <button
                          onClick={() => handleBulkUpdateStatus('pending')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          disabled={bulkProcessing}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark as Pending
                        </button>
                        <button
                          onClick={() => handleBulkUpdateStatus('not_required')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          disabled={bulkProcessing}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Mark as Not Required
                        </button>
                        <div className="border-t border-gray-200 my-1" />
                        <button
                          onClick={handleBulkExport}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export Selected
                        </button>
                        <div className="border-t border-red-200 my-1" />
                        <button
                          onClick={handleBulkDelete}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          disabled={bulkProcessing}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredRegistrations.length && filteredRegistrations.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reg #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrival
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="mt-4 text-sm">No registrations found</p>
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(reg.id)}
                        onChange={() => toggleSelect(reg.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-blue-600">
                        {reg.registration_number || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reg.firstName || ''} {reg.lastName || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{reg.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{reg.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{reg.country || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate" title={reg.institution || ''}>
                        {reg.institution || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {reg.arrivalDate ? new Date(reg.arrivalDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {reg.departureDate ? new Date(reg.departureDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reg.paymentRequired ? (
                        <span className="text-blue-600 text-sm">Yes</span>
                      ) : (
                        <span className="text-gray-400 text-sm">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {reg.paymentByCard ? (
                        <span className="text-green-600 text-lg">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reg.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : reg.paymentStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {reg.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reg.checkedIn ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Checked In
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Checked In
                        </span>
                      )}
                      {reg.checkedInAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(reg.checkedInAt).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedQRRegistration(reg)
                          setQrModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        title="View QR Code"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        QR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredRegistrations.length}</span> of{' '}
            <span className="font-medium">{registrations.length}</span> registrations
          </p>
        </div>
      </div>

      {/* Bulk Email Modal */}
      {bulkEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Email to {selectedIds.size} Registration(s)
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Type
                </label>
                <select
                  value={bulkEmailType}
                  onChange={(e) =>
                    setBulkEmailType(
                      e.target.value as 'payment_reminder' | 'pre_conference_reminder' | 'event_details'
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="payment_reminder">Payment Reminder</option>
                  <option value="pre_conference_reminder">Pre-Conference Reminder</option>
                  <option value="event_details">Event Details</option>
                </select>
              </div>

              {(bulkEmailType === 'pre_conference_reminder' || bulkEmailType === 'event_details') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conference Date
                    </label>
                    <input
                      type="text"
                      value={bulkEmailData.conferenceDate}
                      onChange={(e) =>
                        setBulkEmailData({ ...bulkEmailData, conferenceDate: e.target.value })
                      }
                      placeholder="e.g., March 15, 2025"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conference Location
                    </label>
                    <input
                      type="text"
                      value={bulkEmailData.conferenceLocation}
                      onChange={(e) =>
                        setBulkEmailData({ ...bulkEmailData, conferenceLocation: e.target.value })
                      }
                      placeholder="e.g., Zagreb, Croatia"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conference Program
                    </label>
                    <textarea
                      value={bulkEmailData.conferenceProgram}
                      onChange={(e) =>
                        setBulkEmailData({ ...bulkEmailData, conferenceProgram: e.target.value })
                      }
                      placeholder="Enter conference program details..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={bulkEmailData.customMessage}
                  onChange={(e) =>
                    setBulkEmailData({ ...bulkEmailData, customMessage: e.target.value })
                  }
                  placeholder="Add any additional message..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setBulkEmailModalOpen(false)
                  setBulkEmailData({
                    customMessage: '',
                    conferenceDate: '',
                    conferenceLocation: '',
                    conferenceProgram: '',
                  })
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={bulkProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSendEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={bulkProcessing}
              >
                {bulkProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalOpen && selectedQRRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
              <button
                onClick={() => {
                  setQrModalOpen(false)
                  setSelectedQRRegistration(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-6 text-center">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900">
                  {selectedQRRegistration.firstName} {selectedQRRegistration.lastName}
                </p>
                <p className="text-sm text-gray-500">{selectedQRRegistration.email}</p>
              </div>
              <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-lg">
                <QRCodeSVG
                  value={selectedQRRegistration.id}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Registration ID: {selectedQRRegistration.id}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedQRRegistration.id)
                    showSuccess('Registration ID copied to clipboard!')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Copy ID
                </button>
                <button
                  onClick={() => {
                    setQrModalOpen(false)
                    setSelectedQRRegistration(null)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrapper with Suspense boundary
export default function RegistrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <RegistrationsPageContent />
    </Suspense>
  )
}