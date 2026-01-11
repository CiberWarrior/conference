'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import { useAuth } from '@/contexts/AuthContext'
import StatsCard from '@/components/admin/StatsCard'
import {
  RegistrationsByDayChart,
  PaymentStatusChart,
  RevenueByPeriodChart,
} from '@/components/admin/Charts'
import Link from 'next/link'
import { 
  AlertCircle, 
  Plus, 
  Download, 
  Mail, 
  FileText, 
  Users as UsersIcon, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Globe, 
  Eye, 
  CheckCircle, 
  XCircle,
  Building2,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Settings,
  BarChart3,
  Activity
} from 'lucide-react'
import type { Conference } from '@/types/conference'
import { ABSTRACT_APP_URL } from '@/constants/config'

export default function DashboardPage() {
  const router = useRouter()
  const { currentConference, conferences, loading: conferenceLoading, setCurrentConference } = useConference()
  const { isSuperAdmin, profile } = useAuth()
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    paidRegistrations: 0,
    pendingPayments: 0,
    checkedIn: 0,
    recentRegistrations: [] as any[],
  })
  const [platformStats, setPlatformStats] = useState({
    totalConferences: 0,
    totalUsers: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    activeConferences: 0,
  })
  const [inquiryStats, setInquiryStats] = useState({
    newInquiries: 0,
    totalInquiries: 0,
    conversionRate: 0,
    inquiriesLast7Days: 0,
  })
  const [chartData, setChartData] = useState({
    registrationsByDay: [] as { date: string; count: number }[],
    paymentStatus: [] as { name: string; value: number }[],
    registrationsByCountry: [] as { country: string; count: number }[],
    revenueByPeriod: [] as { period: string; revenue: number }[],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auto-select if only one conference
  useEffect(() => {
    if (!currentConference && conferences.length === 1 && !conferenceLoading) {
      setCurrentConference(conferences[0])
    }
  }, [conferences, currentConference, conferenceLoading, setCurrentConference])

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
          checkedIn: checkedIn,
          recentRegistrations: registrations.slice(0, 5),
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

  const loadPlatformStats = async () => {
    if (!isSuperAdmin) return

    try {
      // Load all conferences
      const { data: allConferences, error: confError } = await supabase
        .from('conferences')
        .select('id, name, published, active')

      if (confError) throw confError

      // Load all users
      const { data: allUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, active')

      if (usersError) throw usersError

      // Load all registrations
      const { data: allRegistrations, error: regError } = await supabase
        .from('registrations')
        .select('id, payment_status, amount_paid')

      if (regError) throw regError

      const activeConferences = allConferences?.filter(c => c.active && c.published).length || 0
      const totalRevenue = allRegistrations?.reduce((sum, r) => {
        return sum + (r.amount_paid || 0)
      }, 0) || 0

      setPlatformStats({
        totalConferences: allConferences?.length || 0,
        totalUsers: allUsers?.length || 0,
        totalRegistrations: allRegistrations?.length || 0,
        totalRevenue,
        activeConferences,
      })
    } catch (error) {
      console.error('Error loading platform stats:', error)
    }
  }

  useEffect(() => {
    if (conferenceLoading) return // Wait for conferences to load

    if (currentConference) {
      loadStats()
    } else {
      // No conference selected
      if (isSuperAdmin) {
        // Super admin can see platform overview without conference
        loadPlatformStats()
        loadInquiryStats()
        setLoading(false)
      } else {
        // Regular admin without conference - stop loading and show message
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConference, isSuperAdmin, conferenceLoading])

  const loadInquiryStats = async () => {
    if (!isSuperAdmin) return

    try {
      const { data, error: statsError } = await supabase
        .from('contact_inquiry_stats')
        .select('*')
        .single()

      if (statsError) {
        console.log('ℹ️ Inquiry stats view not available (this is OK)')
        return
      }

      if (data) {
        setInquiryStats({
          newInquiries: data.new_inquiries || 0,
          totalInquiries: data.total_inquiries || 0,
          conversionRate: data.conversion_rate_percent || 0,
          inquiriesLast7Days: data.inquiries_last_7_days || 0,
        })
      }
    } catch (error) {
      console.log('ℹ️ Could not load inquiry stats (this is OK)')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // No conference selected - show simple message
  if (!currentConference && !conferenceLoading && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Conference Selected</h2>
          <p className="text-gray-600 mb-6">
            Please select a conference from the dropdown menu in the header to view its dashboard and statistics.
          </p>
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

  // Super Admin Dashboard - Platform Overview
  if (isSuperAdmin && !currentConference) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Platform Overview</h2>
          <p className="mt-2 text-gray-600">Welcome back, {profile?.full_name || 'Super Admin'}</p>
        </div>

        {/* Platform Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Conferences"
            value={platformStats.totalConferences}
            color="blue"
            icon={<Building2 className="w-6 h-6" />}
          />
          <StatsCard
            title="Active Conferences"
            value={platformStats.activeConferences}
            color="green"
            icon={<Activity className="w-6 h-6" />}
          />
          <StatsCard
            title="Total Users"
            value={platformStats.totalUsers}
            color="purple"
            icon={<UsersIcon className="w-6 h-6" />}
          />
          <StatsCard
            title="Total Registrations"
            value={platformStats.totalRegistrations}
            color="blue"
            icon={<UsersIcon className="w-6 h-6" />}
          />
          <StatsCard
            title="Total Revenue"
            value={`€${platformStats.totalRevenue.toLocaleString()}`}
            color="green"
            icon={<DollarSign className="w-6 h-6" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/conferences/new"
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Create Conference</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              <UsersIcon className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">Manage Users</span>
            </Link>
            <Link
              href="/admin/inquiries"
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <Mail className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">View Inquiries</span>
            </Link>
            <Link
              href="/admin/conferences"
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">All Conferences</span>
            </Link>
          </div>
        </div>

        {/* Sales & Leads Section */}
        {inquiryStats.totalInquiries > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Sales & Leads</h3>
              <Link
                href="/admin/inquiries"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all inquiries →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100 text-sm font-medium">New Inquiries</span>
                  <Mail className="w-8 h-8 text-blue-200" />
                </div>
                <p className="text-4xl font-bold mb-1">{inquiryStats.newInquiries}</p>
                <p className="text-blue-100 text-sm">Awaiting response</p>
              </div>

              <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">Total Inquiries</span>
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">{inquiryStats.totalInquiries}</p>
                <p className="text-gray-600 text-sm">All time</p>
              </div>

              <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">Conversion Rate</span>
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-4xl font-bold text-green-600 mb-1">{inquiryStats.conversionRate.toFixed(1)}%</p>
                <p className="text-gray-600 text-sm">Lead to customer</p>
              </div>

              <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">Last 7 Days</span>
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-4xl font-bold text-purple-600 mb-1">{inquiryStats.inquiriesLast7Days}</p>
                <p className="text-gray-600 text-sm">Recent leads</p>
              </div>
            </div>
          </div>
        )}

        {/* All Conferences List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Conferences</h3>
            <Link
              href="/admin/conferences"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="p-6">
            {conferences.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No conferences yet</p>
                <Link
                  href="/admin/conferences/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Conference
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {conferences.slice(0, 5).map((conf) => (
                  <Link
                    key={conf.id}
                    href={`/admin/conferences/${conf.id}/settings`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{conf.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {conf.location || 'No location set'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {conf.published ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Draft
                        </span>
                      )}
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Conference Admin Dashboard - Conference Specific
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {currentConference ? `${currentConference.name} Dashboard` : 'Dashboard Overview'}
            </h2>
            <p className="mt-2 text-gray-600">Welcome to your conference management dashboard</p>
          </div>
          {currentConference && (
            <Link
              href={`/admin/conferences/${currentConference.id}/settings`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {currentConference && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href={`/admin/registrations?conference=${currentConference.id}`}
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <UsersIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">View Registrations</span>
            </Link>
            <a
              href={`${ABSTRACT_APP_URL}?conference=${currentConference.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">Manage Abstracts</span>
              <ExternalLink className="w-4 h-4 text-purple-600" />
            </a>
            <Link
              href={`/admin/payments?conference=${currentConference.id}`}
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <CreditCard className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">View Payments</span>
            </Link>
            <Link
              href={`/admin/conferences/${currentConference.id}/settings`}
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Settings</span>
            </Link>
          </div>
        </div>
      )}

      {/* Conference Stats Heading */}
      {inquiryStats.totalInquiries > 0 && isSuperAdmin && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {currentConference ? `${currentConference.name} Statistics` : 'Conference Statistics'}
          </h3>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Abstract Management Link */}
        {currentConference && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Abstract Management</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Manage Abstracts</h4>
                <p className="text-sm text-gray-600 mb-6">
                  Abstract submission and management is handled by a separate application.
                </p>
                <a
                  href={`${ABSTRACT_APP_URL}?conference=${currentConference.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
                >
                  <span>Open Abstract App</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
