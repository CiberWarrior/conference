'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import StatsCard from '@/components/admin/StatsCard'
import {
  RegistrationsByDayChart,
  PaymentStatusChart,
  RegistrationsByCountryChart,
  RevenueByPeriodChart,
} from '@/components/admin/Charts'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const { currentConference, loading: conferenceLoading } = useConference()
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    paidRegistrations: 0,
    pendingPayments: 0,
    totalAbstracts: 0,
    checkedIn: 0,
    recentRegistrations: [] as any[],
    recentAbstracts: [] as any[],
  })
  const [chartData, setChartData] = useState({
    registrationsByDay: [] as { date: string; count: number }[],
    paymentStatus: [] as { name: string; value: number }[],
    registrationsByCountry: [] as { country: string; count: number }[],
    revenueByPeriod: [] as { period: string; revenue: number }[],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentConference) {
      loadStats()
    }
  }, [currentConference])

  const loadStats = async () => {
    if (!currentConference) {
      setError('No conference selected')
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url' || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL in .env.local')
      }

      // Load registrations for current conference
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('conference_id', currentConference.id)
        .order('created_at', { ascending: false })

      if (regError) {
        throw regError
      }

      // Load abstracts for current conference
      const { data: abstracts, error: absError } = await supabase
        .from('abstracts')
        .select('*')
        .eq('conference_id', currentConference.id)
        .order('uploaded_at', { ascending: false })

      if (absError) {
        console.error('Error loading abstracts:', absError)
      }

      if (registrations) {
        const paid = registrations.filter((r) => r.payment_status === 'paid').length
        const pending = registrations.filter((r) => r.payment_status === 'pending').length
        const notRequired = registrations.filter(
          (r) => r.payment_status === 'not_required'
        ).length
        const checkedIn = registrations.filter((r) => r.checked_in === true).length

        // Prepare chart data
        // Registrations by Day
        const registrationsByDayMap = new Map<string, number>()
        registrations.forEach((reg) => {
          const date = new Date(reg.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
          registrationsByDayMap.set(date, (registrationsByDayMap.get(date) || 0) + 1)
        })
        const registrationsByDay = Array.from(registrationsByDayMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => {
            // Simple sort by date string (for better results, parse dates)
            return a.date.localeCompare(b.date)
          })

        // Payment Status Distribution
        const paymentStatus = [
          { name: 'Paid', value: paid },
          { name: 'Pending', value: pending },
          { name: 'Not Required', value: notRequired },
        ].filter((item) => item.value > 0)

        // Registrations by Country
        const countryMap = new Map<string, number>()
        registrations.forEach((reg) => {
          const country = reg.country || 'Unknown'
          countryMap.set(country, (countryMap.get(country) || 0) + 1)
        })
        const registrationsByCountry = Array.from(countryMap.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)

        // Revenue by Period (monthly)
        const revenueByMonthMap = new Map<string, number>()
        registrations
          .filter((r) => r.payment_status === 'paid')
          .forEach((reg) => {
            const month = new Date(reg.created_at).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })
            // Default amount - should be fetched from payment data
            const amount = 50 // This should come from actual payment data
            revenueByMonthMap.set(month, (revenueByMonthMap.get(month) || 0) + amount)
          })
        const revenueByPeriod = Array.from(revenueByMonthMap.entries())
          .map(([period, revenue]) => ({ period, revenue }))
          .sort((a, b) => a.period.localeCompare(b.period))

        setStats({
          totalRegistrations: registrations.length,
          paidRegistrations: paid,
          pendingPayments: pending,
          totalAbstracts: abstracts?.length || 0,
          checkedIn: checkedIn,
          recentRegistrations: registrations.slice(0, 5),
          recentAbstracts: abstracts?.slice(0, 5) || [],
        })

        setChartData({
          registrationsByDay,
          paymentStatus,
          registrationsByCountry,
          revenueByPeriod,
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      setError(error instanceof Error ? error.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // No conference selected
  if (!currentConference && !conferenceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Conference Selected</h2>
          <p className="text-gray-600 mb-6">
            Please select a conference from the header dropdown or create a new one to view the dashboard.
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

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Configuration Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="bg-white rounded p-4 border border-red-200">
              <p className="text-sm text-gray-700 mb-2">Please check your <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file and ensure:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li><code>NEXT_PUBLIC_SUPABASE_URL</code> is set to your Supabase project URL</li>
                <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> is set to your Supabase anon key</li>
                <li>Both values are valid and not placeholders</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-2 text-gray-600">Welcome to your conference management dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard
          title="Total Registrations"
          value={stats.totalRegistrations}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Paid Registrations"
          value={stats.paidRegistrations}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Pending Payments"
          value={stats.pendingPayments}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Abstracts"
          value={stats.totalAbstracts}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          }
        />
        <StatsCard
          title="Checked In"
          value={stats.checkedIn || 0}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {chartData.registrationsByDay.length > 0 && (
            <RegistrationsByDayChart data={chartData.registrationsByDay} />
          )}
          {chartData.paymentStatus.length > 0 && (
            <PaymentStatusChart data={chartData.paymentStatus} />
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6">
          {chartData.registrationsByCountry.length > 0 && (
            <RegistrationsByCountryChart data={chartData.registrationsByCountry} />
          )}
          {chartData.revenueByPeriod.length > 0 && (
            <RevenueByPeriodChart data={chartData.revenueByPeriod} />
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
            <Link
              href="/admin/registrations"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentRegistrations.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No registrations yet
              </div>
            ) : (
              stats.recentRegistrations.map((reg) => (
                <div key={reg.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {reg.first_name} {reg.last_name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{reg.email}</p>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          reg.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : reg.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {reg.payment_status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(reg.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Abstracts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Abstracts</h3>
            <Link
              href="/admin/abstracts"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentAbstracts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No abstracts submitted yet
              </div>
            ) : (
              stats.recentAbstracts.map((abstract) => (
                <div key={abstract.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {abstract.file_name}
                      </p>
                      {abstract.email && (
                        <p className="text-sm text-gray-500 mt-1">{abstract.email}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span className="text-xs text-gray-500">
                        {(abstract.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(abstract.uploaded_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

