'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { showSuccess, showError } from '@/utils/toast'

// Force dynamic rendering for this page (uses searchParams)
export const dynamic = 'force-dynamic'

interface Refund {
  id: string
  first_name: string
  last_name: string
  email: string
  payment_status: string
  refund_requested: boolean
  refund_amount: number | null
  refund_reason: string | null
  refund_status: string
  refund_requested_at: string | null
  refund_processed_at: string | null
}

interface PaymentHistory {
  id: string
  registration_id: string
  transaction_type: string
  amount: number
  currency: string
  status: string
  description: string | null
  created_at: string
}

function PaymentsPageContent() {
  const searchParams = useSearchParams()
  const { currentConference, conferences, setCurrentConference, loading: conferenceLoading } = useConference()
  const [activeTab, setActiveTab] = useState<'reminders' | 'refunds' | 'history'>('reminders')
  const [loading, setLoading] = useState(false)
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [reminderStats, setReminderStats] = useState({
    totalPending: 0,
    withReminders: 0,
    averageReminders: 0,
  })
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [processing, setProcessing] = useState(false)

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
      loadReminderStats()
      if (activeTab === 'refunds') {
        loadRefunds()
      } else if (activeTab === 'history') {
        loadPaymentHistory()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentConference])

  const loadReminderStats = async () => {
    try {
      const response = await fetch('/api/admin/payment-reminders')
      const data = await response.json()
      if (response.ok) {
        setReminderStats(data)
      }
    } catch (error) {
      console.error('Failed to load reminder stats:', error)
    }
  }

  const loadRefunds = async () => {
    if (!currentConference) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/refunds?conference_id=${currentConference.id}`)
      const data = await response.json()
      if (response.ok) {
        setRefunds(data.refunds || [])
      }
    } catch (error) {
      console.error('Failed to load refunds:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPaymentHistory = async () => {
    if (!currentConference) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/payment-history?conference_id=${currentConference.id}`)
      const data = await response.json()
      if (response.ok) {
        setPaymentHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to load payment history:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendReminders = async (dryRun = false) => {
    try {
      setProcessing(true)
      const response = await fetch(
        `/api/admin/payment-reminders?daysSinceRegistration=3&maxReminders=3&dryRun=${dryRun}`,
        { method: 'POST' }
      )
      const data = await response.json()
      if (response.ok) {
        showSuccess(data.message)
        loadReminderStats()
      } else {
        showError('Error: ' + data.error)
      }
    } catch (error) {
      showError('Error sending reminders')
    } finally {
      setProcessing(false)
    }
  }

  const handleRefundRequest = (refund: Refund) => {
    setSelectedRefund(refund)
    setRefundAmount(refund.refund_amount?.toString() || '')
    setRefundReason(refund.refund_reason || '')
    setRefundModalOpen(true)
  }

  const processRefund = async (processNow = false) => {
    if (!selectedRefund) return

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/refunds', {
        method: processNow ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: selectedRefund.id,
          amount: parseFloat(refundAmount) || undefined,
          reason: refundReason,
          processRefund: processNow,
          status: processNow ? undefined : 'approved',
        }),
      })

      const data = await response.json()
      if (response.ok) {
        showSuccess(data.message)
        setRefundModalOpen(false)
        setSelectedRefund(null)
        loadRefunds()
      } else {
        showError('Error: ' + data.error)
      }
    } catch (error) {
      showError('Error processing refund')
    } finally {
      setProcessing(false)
    }
  }

  const updateRefundStatus = async (registrationId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      setProcessing(true)
      const response = await fetch('/api/admin/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          status,
          reason,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        showSuccess(data.message)
        loadRefunds()
      } else {
        showError('Error: ' + data.error)
      }
    } catch (error) {
      showError('Error updating refund status')
    } finally {
      setProcessing(false)
    }
  }

  if (!currentConference && !conferenceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Conference Selected</h2>
          <p className="text-gray-600 mb-6">
            Please select a conference from the header dropdown or create a new one.
          </p>
          <Link
            href="/admin/conferences"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Go to My Conferences
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="mt-2 text-gray-600">Manage payment reminders, refunds, and payment history</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['reminders', 'refunds', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'reminders' && 'Payment Reminders'}
              {tab === 'refunds' && 'Refunds'}
              {tab === 'history' && 'Payment History'}
            </button>
          ))}
        </nav>
      </div>

      {/* Payment Reminders Tab */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Reminders</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Pending Payments</p>
              <p className="text-2xl font-bold text-blue-900">{reminderStats.totalPending}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-600 font-medium">With Reminders Sent</p>
              <p className="text-2xl font-bold text-yellow-900">{reminderStats.withReminders}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Avg Reminders</p>
              <p className="text-2xl font-bold text-green-900">
                {reminderStats.averageReminders.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => sendReminders(true)}
              disabled={processing}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {processing ? 'Testing...' : 'Test Reminders (Dry Run)'}
            </button>
            <button
              onClick={() => sendReminders(false)}
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {processing ? 'Sending...' : 'Send Reminders'}
            </button>
          </div>

          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Reminders are sent to registrations with pending payments</li>
              <li>Default: Send reminder after 3 days, max 3 reminders per registration</li>
              <li>Use &quot;Test Reminders&quot; to see what would be sent without actually sending</li>
            </ul>
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Refund Requests</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : refunds.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No refund requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {refund.first_name} {refund.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{refund.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${refund.refund_amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            refund.refund_status === 'processed'
                              ? 'bg-green-100 text-green-800'
                              : refund.refund_status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : refund.refund_status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {refund.refund_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {refund.refund_requested_at
                          ? new Date(refund.refund_requested_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a
                          href={`/api/admin/invoice-pdf?registrationId=${refund.id}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Invoice PDF
                        </a>
                        {refund.refund_status === 'requested' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateRefundStatus(refund.id, 'approved')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateRefundStatus(refund.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleRefundRequest(refund)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Process
                            </button>
                          </div>
                        )}
                        {refund.refund_status === 'approved' && (
                          <button
                            onClick={() => handleRefundRequest(refund)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Process Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No payment history found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            entry.transaction_type === 'payment'
                              ? 'bg-green-100 text-green-800'
                              : entry.transaction_type === 'refund'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {entry.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={entry.amount < 0 ? 'text-red-600' : 'text-green-600'}
                        >
                          {entry.amount < 0 ? '-' : '+'}${Math.abs(entry.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            entry.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : entry.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entry.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Refund Modal */}
      {refundModalOpen && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Process Refund</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {selectedRefund.first_name} {selectedRefund.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {selectedRefund.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter amount (leave empty for full refund)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter refund reason"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRefundModalOpen(false)
                  setSelectedRefund(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={() => processRefund(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrapper with Suspense boundary
export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentsPageContent />
    </Suspense>
  )
}