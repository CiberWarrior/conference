'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Registration } from '@/types/registration'

export default function AdminPanel() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadRegistrations()
  }, [])

  const loadRegistrations = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setRegistrations(
        data.map((r) => ({
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          email: r.email,
          phone: r.phone,
          paymentRequired: r.payment_required,
          paymentStatus: r.payment_status,
          createdAt: r.created_at,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Payment Required',
      'Payment Status',
      'Created At',
    ]
    const rows = filteredRegistrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.phone,
      r.paymentRequired ? 'Yes' : 'No',
      r.paymentStatus,
      new Date(r.createdAt).toLocaleString(),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === 'all' || reg.paymentStatus === filterStatus

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading registrations...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Registration Admin Panel
            </h1>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Export to CSV
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-6 flex gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Payment</option>
              <option value="paid">Paid</option>
              <option value="not_required">Not Required</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {reg.firstName} {reg.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Total: {filteredRegistrations.length} registration(s)
          </div>
        </div>
      </div>
    </main>
  )
}

