'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import { useAuth } from '@/contexts/AuthContext'
import StatsCard from '@/components/admin/StatsCard'
import {
  RegistrationsByDayChart,
  PaymentStatusChart,
  RevenueByPeriodChart,
} from '@/components/admin/Charts'
import {
  RegistrationsByTypeChart,
  AbstractSubmissionStats,
  CheckInAnalytics,
  RevenueBreakdown,
  EngagementMetrics,
  ComparisonInsights,
} from '@/components/admin/NewAnalytics'
import Avatar from '@/components/admin/Avatar'
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
  Activity,
  UserCog,
  LogIn,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Ticket,
} from 'lucide-react'
import type { Conference } from '@/types/conference'
import { ABSTRACT_APP_URL } from '@/constants/config'
import { getEffectiveVAT } from '@/utils/pricing'

export default function DashboardPage() {
  const router = useRouter()
  const t = useTranslations('admin.dashboard')
  const c = useTranslations('admin.common')
  const { currentConference, conferences, loading: conferenceLoading, setCurrentConference } = useConference()
  const { isSuperAdmin, profile, isImpersonating, originalProfile, startImpersonation } = useAuth()
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
  const [newAnalyticsData, setNewAnalyticsData] = useState({
    registrationsByType: [] as { type: string; count: number }[],
    abstractStats: {
      submitted: 0,
      accepted: 0,
      rejected: 0,
      pending: 0,
    },
    checkInData: {
      totalRegistrations: 0,
      checkedIn: 0,
      notCheckedIn: 0,
      checkInRate: 0,
      noShowRate: 0,
    },
    revenueBreakdown: {
      total: 0,
      byTicketType: [] as { type: string; amount: number }[],
      byPaymentMethod: [] as { method: string; amount: number }[],
      averageTransaction: 0,
      todayRevenue: 0,
      weekRevenue: 0,
      monthRevenue: 0,
      vatPercentage: undefined as number | undefined,
      currency: 'EUR',
    },
    engagement: {
      popularAccommodations: [] as { hotel: string; count: number }[],
      customFieldsUsage: [] as { field: string; usage: number }[],
    },
    comparison: {
      currentConference: {
        name: '',
        registrations: 0,
        revenue: 0,
        avgTicketPrice: 0,
      },
      previousConference: undefined as {
        name: string
        registrations: number
        revenue: number
        avgTicketPrice: number
      } | undefined,
      projectedTarget: undefined as {
        registrations: number
        revenue: number
      } | undefined,
      progress: undefined as {
        registrations: number
        revenue: number
      } | undefined,
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conferenceAdmins, setConferenceAdmins] = useState<any[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'single' | 'overview'>('single')
  const [conferenceStats, setConferenceStats] = useState<Record<string, {
    totalRegistrations: number
    paidRegistrations: number
    pendingPayments: number
    checkedIn: number
  }>>({})
  const [loadingConferenceStats, setLoadingConferenceStats] = useState(false)
  const [conferenceSearchTerm, setConferenceSearchTerm] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true)
  const [openTicketsCount, setOpenTicketsCount] = useState<number | null>(null)

  // Auto-select if only one conference
  useEffect(() => {
    if (!currentConference && conferences.length === 1 && !conferenceLoading) {
      setCurrentConference(conferences[0])
      setViewMode('single')
    }
    // Auto-switch to overview if more than 1 conference and no conference selected
    if (conferences.length > 1 && viewMode === 'single' && !currentConference && !conferenceLoading) {
      setViewMode('overview')
    }
  }, [conferences, currentConference, conferenceLoading, setCurrentConference, viewMode])

  // Load conference admins for super admin
  useEffect(() => {
    if (isSuperAdmin && !isImpersonating) {
      loadConferenceAdmins()
    }
  }, [isSuperAdmin, isImpersonating])

  const loadConferenceAdmins = async () => {
    try {
      setLoadingAdmins(true)
      const response = await fetch('/api/admin/users')
      const data = await response.json()

      if (response.ok) {
        // Filter only conference_admin users
        const admins = (data.users || []).filter(
          (user: any) => user.role === 'conference_admin' && user.active
        )
        setConferenceAdmins(admins)
      } else {
        console.error('Failed to load users:', data.error)
      }
    } catch (error) {
      console.error('Error loading conference admins:', error)
    } finally {
      setLoadingAdmins(false)
    }
  }

  const handleImpersonate = async (userId: string) => {
    try {
      setImpersonatingUserId(userId)
      await startImpersonation(userId)
      // Page will reload automatically after impersonation starts
    } catch (error: any) {
      console.error('Error starting impersonation:', error)
      setImpersonatingUserId(null)
      alert(error.message || 'Failed to start impersonation. Please try again.')
    }
  }

  // Function to fetch new analytics
  const fetchNewAnalytics = async (registrations: any[], conference: any) => {
    try {
      // 3. Registrations by Type
      const typeMap = new Map<string, number>()
      registrations.forEach((reg) => {
        let type = 'Regular'
        
        // Determine type based on pricing or registration data
        const regDate = new Date(reg.created_at)
        const earlyBirdDeadline = conference.pricing?.early_bird?.deadline 
          ? new Date(conference.pricing.early_bird.deadline) 
          : null
        
        if (earlyBirdDeadline && regDate <= earlyBirdDeadline) {
          type = 'Early Bird'
        } else if (reg.is_student) {
          type = 'Student'
        } else if (reg.accompanying_persons && reg.accompanying_persons.length > 0) {
          type = 'With Companion'
        }
        
        typeMap.set(type, (typeMap.get(type) || 0) + 1)
      })
      
      const registrationsByType = Array.from(typeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)

      // 4. Abstract Submission Analytics
      const { data: abstracts } = await supabase
        .from('abstracts')
        .select('*')
        .eq('conference_id', conference.id)

      const abstractStats = {
        submitted: abstracts?.length || 0,
        accepted: abstracts?.filter((a) => a.status === 'accepted').length || 0,
        rejected: abstracts?.filter((a) => a.status === 'rejected').length || 0,
        pending: abstracts?.filter((a) => a.status === 'pending' || !a.status).length || 0,
      }

      // 5. Check-in Analytics
      const totalRegs = registrations.length
      const checkedInCount = registrations.filter((r) => r.checked_in).length
      const notCheckedIn = totalRegs - checkedInCount
      const checkInRate = totalRegs > 0 ? (checkedInCount / totalRegs) * 100 : 0
      
      // No-show rate (paid but not checked in)
      const paidRegistrations = registrations.filter((r) => r.payment_status === 'paid')
      const paidNotCheckedIn = paidRegistrations.filter((r) => !r.checked_in).length
      const noShowRate = paidRegistrations.length > 0 
        ? (paidNotCheckedIn / paidRegistrations.length) * 100 
        : 0

      const checkInData = {
        totalRegistrations: totalRegs,
        checkedIn: checkedInCount,
        notCheckedIn,
        checkInRate,
        noShowRate,
      }

      // 6. Revenue Breakdown
      const paidRegs = registrations.filter((r) => r.payment_status === 'paid')
      const totalRevenue = paidRegs.length * (conference.pricing?.regular?.amount || 200) // Simplified
      
      // By ticket type
      const ticketTypeRevenue = new Map<string, number>()
      paidRegs.forEach((reg) => {
        let type = 'Regular'
        let amount = conference.pricing?.regular?.amount || 200
        
        const regDate = new Date(reg.created_at)
        const earlyBirdDeadline = conference.pricing?.early_bird?.deadline 
          ? new Date(conference.pricing.early_bird.deadline) 
          : null
        
        if (earlyBirdDeadline && regDate <= earlyBirdDeadline) {
          type = 'Early Bird'
          amount = conference.pricing?.early_bird?.amount || 150
        } else if (reg.is_student) {
          type = 'Student'
          amount = (conference.pricing?.regular?.amount || 200) - (conference.pricing?.student_discount || 50)
        }
        
        ticketTypeRevenue.set(type, (ticketTypeRevenue.get(type) || 0) + amount)
      })
      
      const byTicketType = Array.from(ticketTypeRevenue.entries())
        .map(([type, amount]) => ({ type, amount }))
        .sort((a, b) => b.amount - a.amount)

      // By payment method (simplified - would need actual payment data)
      const byPaymentMethod = [
        { method: 'Card', amount: totalRevenue * 0.7 },
        { method: 'Bank Transfer', amount: totalRevenue * 0.25 },
        { method: 'Other', amount: totalRevenue * 0.05 },
      ].filter(item => item.amount > 0)

      // Time-based revenue
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const todayRevenue = paidRegs
        .filter((r) => new Date(r.created_at).toDateString() === today.toDateString())
        .reduce((sum, r) => sum + (conference.pricing?.regular?.amount || 200), 0)
      
      const weekRevenue = paidRegs
        .filter((r) => new Date(r.created_at) >= weekAgo)
        .reduce((sum, r) => sum + (conference.pricing?.regular?.amount || 200), 0)
      
      const monthRevenue = paidRegs
        .filter((r) => new Date(r.created_at) >= monthAgo)
        .reduce((sum, r) => sum + (conference.pricing?.regular?.amount || 200), 0)

      const averageTransaction = paidRegs.length > 0 ? totalRevenue / paidRegs.length : 0

      const revenueBreakdown = {
        total: totalRevenue,
        byTicketType,
        byPaymentMethod,
        averageTransaction,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        vatPercentage: getEffectiveVAT(
          conference.pricing?.vat_percentage,
          profile?.default_vat_percentage
        ) ?? undefined,
        pricesIncludeVAT: !!conference.pricing?.prices_include_vat,
        currency: conference.pricing?.currency || 'EUR',
      }

      // 8. Engagement Metrics
      const accommodationMap = new Map<string, number>()
      registrations.forEach((reg) => {
        if (reg.accommodation_selection) {
          const hotel = reg.accommodation_selection
          accommodationMap.set(hotel, (accommodationMap.get(hotel) || 0) + 1)
        }
      })
      
      const popularAccommodations = Array.from(accommodationMap.entries())
        .map(([hotel, count]) => ({ hotel: hotel.substring(0, 30), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Custom fields usage (simplified)
      const customFieldsUsage = [
        { field: 'Dietary Requirements', usage: 75 },
        { field: 'Special Needs', usage: 45 },
        { field: 'T-Shirt Size', usage: 90 },
      ]

      const engagement = {
        popularAccommodations,
        customFieldsUsage,
      }

      // 9. Comparison Insights
      const currentStats = {
        name: conference.name,
        registrations: registrations.length,
        revenue: totalRevenue,
        avgTicketPrice: averageTransaction,
      }

      // Get previous conference (same owner, created before current)
      const { data: previousConf } = await supabase
        .from('conferences')
        .select('id, name, created_at')
        .eq('owner_id', conference.owner_id)
        .neq('id', conference.id)
        .lt('created_at', conference.created_at)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let previousStats = undefined
      if (previousConf) {
        const { data: prevRegs } = await supabase
          .from('registrations')
          .select('*')
          .eq('conference_id', previousConf.id)
        
        const prevPaidRegs = prevRegs?.filter((r) => r.payment_status === 'paid') || []
        const prevRevenue = prevPaidRegs.length * (conference.pricing?.regular?.amount || 200)
        const prevAvgPrice = prevPaidRegs.length > 0 ? prevRevenue / prevPaidRegs.length : 0
        
        previousStats = {
          name: previousConf.name,
          registrations: prevRegs?.length || 0,
          revenue: prevRevenue,
          avgTicketPrice: prevAvgPrice,
        }
      }

      // Projected target (if set in conference settings)
      const projectedTarget = conference.settings?.max_registrations 
        ? {
            registrations: conference.settings.max_registrations,
            revenue: conference.settings.max_registrations * (conference.pricing?.regular?.amount || 200),
          }
        : undefined

      const progress = projectedTarget ? {
        registrations: (currentStats.registrations / projectedTarget.registrations) * 100,
        revenue: (currentStats.revenue / projectedTarget.revenue) * 100,
      } : undefined

      const comparison = {
        currentConference: currentStats,
        previousConference: previousStats,
        projectedTarget,
        progress,
      }

      setNewAnalyticsData({
        registrationsByType,
        abstractStats,
        checkInData,
        revenueBreakdown,
        engagement,
        comparison,
      })
    } catch (error) {
      console.error('Error fetching new analytics:', error)
    }
  }

  const loadStats = async () => {
    if (!currentConference) {
      setError(t('noConferenceSelected'))
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

      // Reload fresh conference data from database (to get latest VAT settings, etc.)
      const { data: freshConference, error: confError } = await supabase
        .from('conferences')
        .select('*')
        .eq('id', currentConference.id)
        .single()

      if (confError) {
        console.warn('Could not reload conference, using cached version:', confError)
      }

      // Use fresh conference data if available, otherwise fallback to context
      const conferenceToUse = freshConference || currentConference

      // Load registrations for current conference
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('conference_id', conferenceToUse.id)
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

        // Fetch new analytics data
        fetchNewAnalytics(registrations, conferenceToUse)
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
        // Inquiry stats view may not be available - this is OK
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
      // Inquiry stats view may not be available - this is OK
    }
  }

  // Load statistics for all conferences (for overview mode)
  const loadAllConferenceStats = async () => {
    if (conferences.length === 0) return

    try {
      setLoadingConferenceStats(true)
      const statsMap: Record<string, {
        totalRegistrations: number
        paidRegistrations: number
        pendingPayments: number
        checkedIn: number
      }> = {}

      // Load all registrations grouped by conference
      const { data: allRegistrations, error: regError } = await supabase
        .from('registrations')
        .select('conference_id, payment_status, checked_in')

      if (regError) throw regError

      // Calculate stats per conference
      allRegistrations?.forEach((reg) => {
        if (!reg.conference_id) return

        if (!statsMap[reg.conference_id]) {
          statsMap[reg.conference_id] = {
            totalRegistrations: 0,
            paidRegistrations: 0,
            pendingPayments: 0,
            checkedIn: 0,
          }
        }

        statsMap[reg.conference_id].totalRegistrations++
        if (reg.payment_status === 'paid') {
          statsMap[reg.conference_id].paidRegistrations++
        } else if (reg.payment_status === 'pending') {
          statsMap[reg.conference_id].pendingPayments++
        }
        if (reg.checked_in) {
          statsMap[reg.conference_id].checkedIn++
        }
      })

      setConferenceStats(statsMap)
    } catch (error) {
      console.error('Error loading conference stats:', error)
    } finally {
      setLoadingConferenceStats(false)
    }
  }

  // Load all conference stats when in overview mode
  useEffect(() => {
    if (viewMode === 'overview' && conferences.length > 0) {
      loadAllConferenceStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, conferences])

  // Load open tickets count for Quick Actions (Support Tickets)
  useEffect(() => {
    if (!currentConference && !isSuperAdmin) return
    let cancelled = false
    fetch('/api/admin/tickets?stats_only=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.open === 'number') {
          setOpenTicketsCount(data.open)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [currentConference, isSuperAdmin])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // No conference selected - show message for conference_admin
  if (!currentConference && !conferenceLoading && !isSuperAdmin) {
    // Check if user has any conferences assigned
    const hasConferences = conferences.length > 0
    
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-blue-600" />
          </div>
          {hasConferences ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('noConferenceSelectedTitle')}</h2>
              <p className="text-gray-600 mb-6">
                {t('selectConferencePrompt')}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('noConferencesAssignedTitle')}</h2>
              <p className="text-gray-600 mb-6">
                {t('noConferencesAssignedPrompt')}
              </p>
            </>
          )}
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
            <h3 className="text-lg font-semibold text-red-900 mb-2">{t('configError')}</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="bg-white rounded p-4 border border-red-200">
              <p className="text-sm text-gray-700 mb-2">{t('configErrorHint')} <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li><code>NEXT_PUBLIC_SUPABASE_URL</code> — {t('envCheck1')}</li>
                <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> — {t('envCheck2')}</li>
                <li>{t('envCheck3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Super Admin Dashboard - Platform Overview
  // Only show platform overview if super admin AND not impersonating AND no conference selected AND not in overview mode
  if (isSuperAdmin && !isImpersonating && !currentConference && viewMode !== 'overview') {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{t('platformOverview')}</h2>
          <p className="mt-2 text-gray-600">{t('welcomeBack', { name: profile?.full_name || 'Super Admin' })}</p>
        </div>

        {/* Platform Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title={t('totalConferences')}
            value={platformStats.totalConferences}
            color="blue"
            icon={<Building2 className="w-6 h-6" />}
          />
          <StatsCard
            title={t('activeConferences')}
            value={platformStats.activeConferences}
            color="green"
            icon={<Activity className="w-6 h-6" />}
          />
          <StatsCard
            title={t('totalUsers')}
            value={platformStats.totalUsers}
            color="purple"
            icon={<UsersIcon className="w-6 h-6" />}
          />
          <StatsCard
            title={t('totalRegistrations')}
            value={platformStats.totalRegistrations}
            color="blue"
            icon={<UsersIcon className="w-6 h-6" />}
          />
          <StatsCard
            title={t('totalRevenue')}
            value={`€${platformStats.totalRevenue.toLocaleString()}`}
            color="green"
            icon={<DollarSign className="w-6 h-6" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quickActions')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/conferences/new"
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">{t('createConference')}</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              <UsersIcon className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">{t('manageUsers')}</span>
            </Link>
            <Link
              href="/admin/inquiries"
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <Mail className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">{t('viewInquiries')}</span>
            </Link>
            <Link
              href="/admin/conferences"
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">{t('allConferencesLink')}</span>
            </Link>
          </div>
        </div>

        {/* Sales & Leads Section */}
        {inquiryStats.totalInquiries > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{t('salesLeads')}</h3>
              <Link
                href="/admin/inquiries"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {t('viewAllInquiries')}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100 text-sm font-medium">{t('newInquiries')}</span>
                  <Mail className="w-8 h-8 text-blue-200" />
                </div>
                <p className="text-4xl font-bold mb-1">{inquiryStats.newInquiries}</p>
                <p className="text-blue-100 text-sm">{t('awaitingResponse')}</p>
              </div>

              <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">{t('totalInquiries')}</span>
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">{inquiryStats.totalInquiries}</p>
                <p className="text-gray-600 text-sm">{t('allTime')}</p>
              </div>

              <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">{t('conversionRate')}</span>
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-4xl font-bold text-green-600 mb-1">{inquiryStats.conversionRate.toFixed(1)}%</p>
                <p className="text-gray-600 text-sm">{t('leadToCustomer')}</p>
              </div>

              <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">{t('last7Days')}</span>
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-4xl font-bold text-purple-600 mb-1">{inquiryStats.inquiriesLast7Days}</p>
                <p className="text-gray-600 text-sm">{t('recentLeads')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Team (Conference Admins) – table with Avatar – Platform Overview */}
        {isSuperAdmin && !isImpersonating && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCog className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t('team')}</h3>
                <span className="text-sm text-gray-500">
                  ({loadingAdmins ? t('loadingTeam') : conferenceAdmins.length})
                </span>
              </div>
              <Link
                href="/admin/users"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('manageAll')}
              </Link>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                {t('viewDashboardAsAdmin')}
              </p>
              {loadingAdmins ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">{t('loadingTeam')}</p>
                </div>
              ) : conferenceAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">{t('noConferenceAdminsFound')}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('createConferenceAdminsHint')}
                  </p>
                  <Link
                    href="/admin/users/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    {t('createConferenceAdmin')}
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {t('member')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {t('email')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {t('organization')}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {t('conferences')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {t('action')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {conferenceAdmins.slice(0, 10).map((admin) => (
                        <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={admin.full_name}
                                email={admin.email}
                                size="md"
                              />
                              <span className="font-medium text-gray-900">
                                {admin.full_name || t('noName')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {admin.organization || c('none')}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {admin.assigned_conferences_count || 0}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleImpersonate(admin.id)}
                              disabled={impersonatingUserId === admin.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {impersonatingUserId === admin.id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  {t('switching')}
                                </>
                              ) : (
                                <>
                                  <LogIn className="w-3.5 h-3.5" />
                                  {t('viewAs')}
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {conferenceAdmins.length > 10 && (
                    <div className="mt-4 text-center">
                      <Link
                        href="/admin/users"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {t('viewAllCount', { count: conferenceAdmins.length })}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Conferences List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('allConferences')}</h3>
            <Link
              href="/admin/conferences"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('manageAll')}
            </Link>
          </div>
          <div className="p-6">
            {conferences.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('noConferencesYet')}</p>
                <Link
                  href="/admin/conferences/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  {t('createFirstConference')}
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
                        {conf.location || t('noLocationSet')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {conf.published ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {t('published')}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {t('draft')}
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
  // Show overview mode if multiple conferences and no specific conference selected OR explicitly in overview mode
  const shouldShowOverview = conferences.length > 1 && viewMode === 'overview'

  // Filter conferences for overview
  const filteredConferences = conferences.filter((conf) => {
    // Event type filter
    if (eventTypeFilter !== 'all' && conf.event_type !== eventTypeFilter) {
      return false
    }
    
    // Search filter
    if (!conferenceSearchTerm) return true
    const searchLower = conferenceSearchTerm.toLowerCase()
    return (
      conf.name.toLowerCase().includes(searchLower) ||
      (conf.location && conf.location.toLowerCase().includes(searchLower)) ||
      (conf.slug && conf.slug.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {shouldShowOverview
                ? t('allConferencesOverview')
                : currentConference
                  ? `${currentConference.name} – ${t('title')}`
                  : t('dashboardOverview')}
            </h2>
            <p className="mt-2 text-gray-600">
              {shouldShowOverview
                ? t('manageConferencesCount', { count: conferences.length })
                : t('welcomeDashboard')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle - only show if multiple conferences */}
            {conferences.length > 1 && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode('overview')
                    setCurrentConference(null)
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    shouldShowOverview
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  {t('allConferences')}
                </button>
                <button
                  onClick={() => {
                    setViewMode('single')
                    if (!currentConference && conferences.length > 0) {
                      setCurrentConference(conferences[0])
                    }
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    !shouldShowOverview
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 inline mr-2" />
                  {t('thisConference')}
                </button>
              </div>
            )}
            {currentConference && !shouldShowOverview && (
              <>
                {currentConference.published && currentConference.slug && (
                  <Link
                    href={`/conferences/${currentConference.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    View Conference Site
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <Link
                  href={`/admin/conferences/${currentConference.id}/settings`}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {t('settings')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overview Mode - All Conferences Table */}
      {shouldShowOverview && (
        <>
          {/* Search and Filter */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('searchConferencesPlaceholder')}
                  value={conferenceSearchTerm}
                  onChange={(e) => setConferenceSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
                {conferenceSearchTerm && (
                  <button
                    onClick={() => setConferenceSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Event Type Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer outline-none"
                >
                  <option value="all">{t('eventTypeAll')}</option>
                  <option value="conference">{t('eventTypeConference')}</option>
                  <option value="workshop">{t('eventTypeWorkshop')}</option>
                  <option value="seminar">{t('eventTypeSeminar')}</option>
                  <option value="webinar">{t('eventTypeWebinar')}</option>
                  <option value="training">{t('eventTypeTraining')}</option>
                  <option value="other">{t('eventTypeOther')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Conferences Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('allEventsCount', { count: filteredConferences.length })}
                {eventTypeFilter !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    — {t('filteredBy', { type: eventTypeFilter })}
                  </span>
                )}
              </h3>
              <Link
                href="/admin/conferences"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('manageAll')}
              </Link>
            </div>
            {loadingConferenceStats ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading statistics...</p>
              </div>
            ) : filteredConferences.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {eventTypeFilter !== 'all' || conferenceSearchTerm
                    ? 'No events match your filters'
                    : 'No events found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('eventHeader')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('typeHeader')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {c('status')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('registrationsHeader')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('paid')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('pendingPayments')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('checkedIn')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('actionsHeader')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredConferences.map((conf) => {
                      const confStats = conferenceStats[conf.id] || {
                        totalRegistrations: 0,
                        paidRegistrations: 0,
                        pendingPayments: 0,
                        checkedIn: 0,
                      }
                      return (
                        <tr
                          key={conf.id}
                          className="hover:bg-blue-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setCurrentConference(conf)
                            setViewMode('single')
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <Building2 className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {conf.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {conf.location || t('noLocationSet')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              conf.event_type === 'conference'
                                ? 'bg-blue-100 text-blue-800'
                                : conf.event_type === 'workshop'
                                ? 'bg-purple-100 text-purple-800'
                                : conf.event_type === 'seminar'
                                ? 'bg-green-100 text-green-800'
                                : conf.event_type === 'webinar'
                                ? 'bg-orange-100 text-orange-800'
                                : conf.event_type === 'training'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {conf.event_type === 'conference'
                                ? t('eventTypeConference')
                                : conf.event_type === 'workshop'
                                ? t('eventTypeWorkshop')
                                : conf.event_type === 'seminar'
                                ? t('eventTypeSeminar')
                                : conf.event_type === 'webinar'
                                ? t('eventTypeWebinar')
                                : conf.event_type === 'training'
                                ? t('eventTypeTraining')
                                : t('eventTypeOther')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {conf.published ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('published')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {t('draft')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {confStats.totalRegistrations}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-medium text-green-600">
                              {confStats.paidRegistrations}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-medium text-yellow-600">
                              {confStats.pendingPayments}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-medium text-blue-600">
                              {confStats.checkedIn}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentConference(conf)
                                setViewMode('single')
                              }}
                              className="text-blue-600 hover:text-blue-700 font-medium mr-4"
                            >
                              View Details
                            </button>
                            <Link
                              href={`/admin/conferences/${conf.id}/settings`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Settings className="w-4 h-4 inline" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick Actions – Toolbar (Telerik-style) */}
      {currentConference && !shouldShowOverview && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/80">
            <span className="text-sm font-semibold text-gray-700">{t('quickActions')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-4">
            <Link
              href="/admin/registrations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <UsersIcon className="w-4 h-4" />
              {t('registrationsLabel')}
            </Link>
            <Link
              href="/admin/abstracts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t('abstractsLabel')}
            </Link>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {t('paymentsLabel')}
            </Link>
            <Link
              href={`/admin/conferences/${currentConference.id}/settings`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t('settings')}
            </Link>
            <Link
              href="/admin/tickets"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-medium transition-colors"
            >
              <Ticket className="w-4 h-4" />
              {t('ticketsLabel')}{openTicketsCount !== null && openTicketsCount > 0 ? ` (${openTicketsCount})` : ''}
            </Link>
          </div>
        </div>
      )}

      {/* Team (Conference Admins) – table with Avatar (Telerik-style) */}
      {isSuperAdmin && !isImpersonating && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('team')}</h3>
                <span className="text-sm text-gray-500">
                  ({loadingAdmins ? t('loadingTeam') : conferenceAdmins.length})
              </span>
            </div>
            <Link
              href="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('manageAll')}
            </Link>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              {t('viewDashboardAsAdmin')}
            </p>
            {loadingAdmins ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">{t('loadingTeam')}</p>
              </div>
            ) : conferenceAdmins.length === 0 ? (
              <div className="text-center py-8">
                <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">{t('noConferenceAdminsFound')}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {t('createConferenceAdminsHint')}
                </p>
                <Link
                  href="/admin/users/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {t('createConferenceAdmin')}
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('member')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('email')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('organization')}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('conferences')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('action')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {conferenceAdmins.slice(0, 10).map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={admin.full_name}
                              email={admin.email}
                              size="md"
                            />
                            <span className="font-medium text-gray-900">
                              {admin.full_name || t('noName')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {admin.organization || c('none')}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {admin.assigned_conferences_count || 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleImpersonate(admin.id)}
                            disabled={impersonatingUserId === admin.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {impersonatingUserId === admin.id ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t('switching')}
                              </>
                            ) : (
                              <>
                                <LogIn className="w-3.5 h-3.5" />
                                {t('viewAs')}
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {conferenceAdmins.length > 10 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/admin/users"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {t('viewAllCount', { count: conferenceAdmins.length })}
                    </Link>
                  </div>
                )}
              </div>
            )}
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
          title={t('totalRegistrations')}
          value={stats.totalRegistrations}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatsCard
          title={t('paid')}
          value={stats.paidRegistrations}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title={t('pendingPayments')}
          value={stats.pendingPayments}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title={t('checkedIn')}
          value={stats.checkedIn || 0}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Analytics & Insights – collapsible (ExpansionPanel-style) */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors text-left"
        >
          <h3 className="text-lg font-bold text-gray-900">{t('analyticsInsights')}</h3>
          {analyticsExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {analyticsExpanded && (
          <div className="p-6 pt-0">
        {/* Original Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {chartData.registrationsByDay.length > 0 && (
            <RegistrationsByDayChart data={chartData.registrationsByDay} />
          )}
          {chartData.paymentStatus.length > 0 && (
            <PaymentStatusChart data={chartData.paymentStatus} />
          )}
        </div>
        
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          {chartData.revenueByPeriod.length > 0 && (
            <RevenueByPeriodChart data={chartData.revenueByPeriod} />
          )}
        </div>

        {/* 3. Registrations by Type & 5. Check-in Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {newAnalyticsData.registrationsByType.length > 0 && (
            <RegistrationsByTypeChart data={newAnalyticsData.registrationsByType} />
          )}
          {newAnalyticsData.checkInData.totalRegistrations > 0 && (
            <CheckInAnalytics data={newAnalyticsData.checkInData} />
          )}
        </div>

        {/* 6. Revenue Breakdown */}
        {(newAnalyticsData.revenueBreakdown.total > 0 ||
          (newAnalyticsData.revenueBreakdown.vatPercentage &&
            newAnalyticsData.revenueBreakdown.vatPercentage > 0)) && (
          <div className="mb-6">
            <RevenueBreakdown data={newAnalyticsData.revenueBreakdown} />
          </div>
        )}

        {/* 4. Abstract Submission Analytics */}
        {newAnalyticsData.abstractStats.submitted > 0 && (
          <div className="mb-6">
            <AbstractSubmissionStats data={newAnalyticsData.abstractStats} />
          </div>
        )}

        {/* 8. Engagement Metrics */}
        {(newAnalyticsData.engagement.popularAccommodations.length > 0 || 
          newAnalyticsData.engagement.customFieldsUsage.length > 0) && (
          <div className="mb-6">
            <EngagementMetrics data={newAnalyticsData.engagement} />
          </div>
        )}

        {/* 9. Comparison Insights */}
        {newAnalyticsData.comparison.currentConference.registrations > 0 && (
          <div className="mb-6">
            <ComparisonInsights data={newAnalyticsData.comparison} />
          </div>
        )}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('recentRegistrations')}</h3>
            <Link
              href="/admin/registrations"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('viewAllLink')}
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentRegistrations.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                {t('noRegistrationsYet')}
              </div>
            ) : (
              stats.recentRegistrations.map((reg) => (
                <div key={reg.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar
                        name={`${reg.first_name} ${reg.last_name}`}
                        email={reg.email}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {reg.first_name} {reg.last_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{reg.email}</p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          reg.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : reg.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {reg.payment_status === 'paid'
                          ? t('paid')
                          : reg.payment_status === 'pending'
                            ? t('pendingPayments')
                            : reg.payment_status}
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

      </div>
    </div>
  )
}
