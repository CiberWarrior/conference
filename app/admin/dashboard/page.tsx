'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { useConference } from '@/contexts/ConferenceContext'
import { useAuth } from '@/contexts/AuthContext'
import StatsCard from '@/components/admin/StatsCard'
import PaymentStatusBadge from '@/components/admin/PaymentStatusBadge'
import StatusBadge, { type StatusBadgeTone } from '@/components/admin/StatusBadge'
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

/**
 * New registrations store contact data in participants[0].customFields /
 * custom_data; the legacy first_name/last_name/email columns are null there,
 * so fall back across all sources.
 */
function extractContact(reg: Record<string, any>): {
  firstName: string
  lastName: string
  email: string
} {
  const customData = reg.custom_data || {}
  const firstParticipant =
    Array.isArray(reg.participants) && reg.participants.length > 0
      ? reg.participants[0]?.customFields ?? {}
      : {}

  const pick = (keys: string[], pattern?: (k: string) => boolean): string => {
    for (const source of [reg, customData, firstParticipant]) {
      for (const key of keys) {
        const value = source?.[key]
        if (value != null && String(value).trim()) return String(value).trim()
      }
    }
    if (pattern) {
      for (const source of [customData, firstParticipant]) {
        for (const [k, v] of Object.entries(source)) {
          if (pattern(k.toLowerCase()) && v != null && String(v).trim()) {
            return String(v).trim()
          }
        }
      }
    }
    return ''
  }

  return {
    firstName: pick(
      ['first_name', 'firstName', 'First Name', 'ime', 'Ime'],
      (k) => (k.includes('first') && k.includes('name')) || k === 'ime'
    ),
    lastName: pick(
      ['last_name', 'lastName', 'Last Name', 'prezime', 'Prezime', 'surname'],
      (k) => (k.includes('last') && k.includes('name')) || k.includes('surname') || k === 'prezime'
    ),
    email: pick(
      ['email', 'Email', 'E-mail', 'e_mail', 'EMAIL'],
      (k) => k.includes('email') || k.includes('e-mail')
    ),
  }
}

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 2,
  }).format(amount)

type Trend = { value: string; isPositive: boolean }

function countInWindow<T extends { created_at: string }>(
  items: T[],
  start: Date,
  end: Date,
  predicate?: (item: T) => boolean
) {
  return items.filter((item) => {
    const created = new Date(item.created_at).getTime()
    if (created < start.getTime() || created >= end.getTime()) return false
    return predicate ? predicate(item) : true
  }).length
}

function buildWeekTrend(
  current: number,
  previous: number,
  labels: { thanLastWeek: string; newThisWeek: string; unchanged: string },
  higherIsBetter = true
): Trend | undefined {
  if (current === 0 && previous === 0) return undefined
  if (previous === 0) {
    return { value: labels.newThisWeek, isPositive: higherIsBetter }
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) {
    return { value: labels.unchanged, isPositive: true }
  }
  const improved = higherIsBetter ? pct > 0 : pct < 0
  return {
    value: `${pct > 0 ? '+' : ''}${pct}% ${labels.thanLastWeek}`,
    isPositive: improved,
  }
}

function DashboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedView = searchParams.get('view')
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
    trends: {
      totalRegistrations: undefined as Trend | undefined,
      paidRegistrations: undefined as Trend | undefined,
      pendingPayments: undefined as Trend | undefined,
    },
  })
  const [platformStats, setPlatformStats] = useState({
    totalConferences: 0,
    totalUsers: 0,
    totalRegistrations: 0,
    // Sum of paid conference registration fees (organizers' money, not platform income)
    conferenceTurnover: 0,
    activeConferences: 0,
  })
  const [platformRevenue, setPlatformRevenue] = useState({
    mrr: 0,
    currency: 'EUR',
    activeCount: 0,
    pendingOrderCount: 0,
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
  const [viewMode, setViewMode] = useState<'single' | 'overview' | 'platform'>('single')
  const [conferenceStats, setConferenceStats] = useState<Record<string, {
    totalRegistrations: number
    paidRegistrations: number
    pendingPayments: number
    checkedIn: number
  }>>({})
  const [loadingConferenceStats, setLoadingConferenceStats] = useState(false)
  const [conferenceSearchTerm, setConferenceSearchTerm] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  // Detailed charts are useful for analysis, but should not push daily
  // operational work below the fold when an organizer opens a conference.
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false)
  const [openTicketsCount, setOpenTicketsCount] = useState<number | null>(null)

  // Auto-select if only one conference
  useEffect(() => {
    // Don't auto-select/switch while the super admin is on the platform view
    if (viewMode === 'platform') return
    if (!currentConference && conferences.length === 1 && !conferenceLoading) {
      setCurrentConference(conferences[0])
      setViewMode('single')
    }
    // Auto-switch to overview if more than 1 conference and no conference selected
    if (conferences.length > 1 && viewMode === 'single' && !currentConference && !conferenceLoading) {
      setViewMode('overview')
    }
  }, [conferences, currentConference, conferenceLoading, setCurrentConference, viewMode])

  // Sidebar links pass an explicit ?view= so navigating here from another admin
  // page always lands on the intended mode, instead of whatever was last selected.
  useEffect(() => {
    if (conferenceLoading || !requestedView) return

    if (requestedView === 'platform' && isSuperAdmin) {
      setViewMode('platform')
      setCurrentConference(null)
    } else if (requestedView === 'overview') {
      setViewMode('overview')
      setCurrentConference(null)
    } else if (requestedView === 'single') {
      setViewMode('single')
      if (!currentConference && conferences.length > 0) {
        setCurrentConference(conferences[0])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedView, conferenceLoading, isSuperAdmin])

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
      // 3. Registrations by Type – prefer actual fee name (new fee system),
      // fall back to the legacy heuristic for older registrations
      const typeMap = new Map<string, number>()
      registrations.forEach((reg) => {
        let type =
          (reg.custom_registration_fees?.name as string) ||
          (reg.registration_fee_type as string) ||
          ''

        if (!type) {
          type = 'Regular'
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

      // 6. Revenue Breakdown – use actual payment_amount from registrations
      const paidRegs = registrations.filter((r) => r.payment_status === 'paid')
      const getAmount = (r: { payment_amount?: number | null; created_at?: string }) =>
        r.payment_amount ?? 0
      const totalRevenue = paidRegs.reduce((sum, r) => sum + getAmount(r), 0)

      // By ticket type – new fee system (custom_registration_fees) first, legacy column as fallback
      const ticketTypeRevenue = new Map<string, number>()
      paidRegs.forEach((reg) => {
        const amount = getAmount(reg)
        const type =
          (reg.custom_registration_fees?.name as string) ||
          (reg.registration_fee_type as string) ||
          'Regular'
        ticketTypeRevenue.set(type, (ticketTypeRevenue.get(type) || 0) + amount)
      })
      const byTicketType = Array.from(ticketTypeRevenue.entries())
        .map(([type, amount]) => ({ type, amount }))
        .sort((a, b) => b.amount - a.amount)

      // By payment method – use actual payment_method from registrations
      const byPaymentMethodMap = new Map<string, number>()
      paidRegs.forEach((reg) => {
        const amount = getAmount(reg)
        const method =
          reg.payment_method === 'card'
            ? 'Card'
            : reg.payment_method === 'bank_transfer'
              ? 'Bank Transfer'
              : 'Other'
        byPaymentMethodMap.set(method, (byPaymentMethodMap.get(method) || 0) + amount)
      })
      const byPaymentMethod = Array.from(byPaymentMethodMap.entries()).map(([method, amount]) => ({
        method,
        amount,
      }))

      // Time-based revenue
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      const todayRevenue = paidRegs
        .filter((r) => new Date(r.created_at).toDateString() === today.toDateString())
        .reduce((sum, r) => sum + getAmount(r), 0)
      const weekRevenue = paidRegs
        .filter((r) => new Date(r.created_at) >= weekAgo)
        .reduce((sum, r) => sum + getAmount(r), 0)
      const monthRevenue = paidRegs
        .filter((r) => new Date(r.created_at) >= monthAgo)
        .reduce((sum, r) => sum + getAmount(r), 0)

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

      // 8. Engagement Metrics – use accommodation.hotel_id (JSONB)
      const accommodationMap = new Map<string, number>()
      const hotelOpts = (conference.settings?.hotel_options as { id: string; name?: string }[]) || []
      registrations.forEach((reg) => {
        const acc = reg.accommodation as { hotel_id?: string } | null
        const hotelId = acc?.hotel_id
        if (hotelId) {
          const name = hotelOpts.find((h) => h.id === hotelId)?.name ?? hotelId
          accommodationMap.set(name, (accommodationMap.get(name) || 0) + 1)
        }
      })
      
      const popularAccommodations = Array.from(accommodationMap.entries())
        .map(([hotel, count]) => ({ hotel: hotel.substring(0, 30), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Custom fields usage – real fill rate per configured custom field
      const customFieldDefs = (
        (conference.settings?.custom_registration_fields as {
          name: string
          label?: string
          type?: string
        }[]) || []
      ).filter((f) => f.type !== 'separator')

      const customFieldsUsage = customFieldDefs
        .map((field) => {
          const filled = registrations.filter((reg) => {
            const participantFields = reg.participants?.[0]?.customFields || {}
            const value = participantFields[field.name] ?? reg.custom_data?.[field.name]
            return value != null && String(value).trim() !== ''
          }).length
          return {
            field: (field.label || field.name).substring(0, 30),
            usage: registrations.length > 0
              ? Math.round((filled / registrations.length) * 100)
              : 0,
          }
        })
        .filter((f) => f.usage > 0)
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 5)

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
          .select('payment_status, payment_amount')
          .eq('conference_id', previousConf.id)
        const prevPaidRegs = prevRegs?.filter((r) => r.payment_status === 'paid') || []
        const prevRevenue = prevPaidRegs.reduce(
          (s, r) => s + (r.payment_amount ?? 0),
          0
        )
        const prevAvgPrice = prevPaidRegs.length > 0 ? prevRevenue / prevPaidRegs.length : 0
        
        previousStats = {
          name: previousConf.name,
          registrations: prevRegs?.length || 0,
          revenue: prevRevenue,
          avgTicketPrice: prevAvgPrice,
        }
      }

      // Projected target (if set in conference settings)
      const avgPrice = paidRegs.length > 0 ? totalRevenue / paidRegs.length : (conference.pricing?.regular?.amount ?? 0)
      const projectedTarget = conference.settings?.max_registrations
        ? {
            registrations: conference.settings.max_registrations,
            revenue: conference.settings.max_registrations * avgPrice,
          }
        : undefined

      const progress = projectedTarget ? {
        registrations:
          projectedTarget.registrations > 0
            ? (currentStats.registrations / projectedTarget.registrations) * 100
            : 0,
        revenue:
          projectedTarget.revenue > 0
            ? (currentStats.revenue / projectedTarget.revenue) * 100
            : 0,
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

      // Load registrations for current conference (with fee name from the new fee system)
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*, custom_registration_fees(name)')
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

        // Revenue by Period (monthly) – actual payment_amount from registrations
        const revenueByMonthMap = new Map<string, number>()
        registrations
          .filter((r) => r.payment_status === 'paid')
          .forEach((reg) => {
            const month = new Date(reg.created_at).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })
            const amount = reg.payment_amount ?? 0
            revenueByMonthMap.set(month, (revenueByMonthMap.get(month) || 0) + amount)
          })
        const revenueByPeriod = Array.from(revenueByMonthMap.entries())
          .map(([period, revenue]) => ({ period, revenue }))
          .sort((a, b) => a.period.localeCompare(b.period))

        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        const trendLabels = {
          thanLastWeek: t('thanLastWeek'),
          newThisWeek: t('newThisWeek'),
          unchanged: t('trendUnchanged'),
        }

        const regsThisWeek = countInWindow(registrations, weekAgo, now)
        const regsPrevWeek = countInWindow(registrations, twoWeeksAgo, weekAgo)
        const paidThisWeek = countInWindow(
          registrations,
          weekAgo,
          now,
          (r) => r.payment_status === 'paid'
        )
        const paidPrevWeek = countInWindow(
          registrations,
          twoWeeksAgo,
          weekAgo,
          (r) => r.payment_status === 'paid'
        )
        const pendingThisWeek = countInWindow(
          registrations,
          weekAgo,
          now,
          (r) => r.payment_status === 'pending'
        )
        const pendingPrevWeek = countInWindow(
          registrations,
          twoWeeksAgo,
          weekAgo,
          (r) => r.payment_status === 'pending'
        )

        setStats({
          totalRegistrations: registrations.length,
          paidRegistrations: paid,
          pendingPayments: pending,
          checkedIn: checkedIn,
          recentRegistrations: registrations.slice(0, 8),
          trends: {
            totalRegistrations: buildWeekTrend(
              regsThisWeek,
              regsPrevWeek,
              trendLabels,
              true
            ),
            paidRegistrations: buildWeekTrend(
              paidThisWeek,
              paidPrevWeek,
              trendLabels,
              true
            ),
            pendingPayments: buildWeekTrend(
              pendingThisWeek,
              pendingPrevWeek,
              trendLabels,
              false
            ),
          },
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
        .select('id, payment_status, payment_amount')

      if (regError) throw regError

      const activeConferences = allConferences?.filter(c => c.active && c.published).length || 0
      const conferenceTurnover = allRegistrations?.reduce((sum, r) => {
        return r.payment_status === 'paid' ? sum + (r.payment_amount || 0) : sum
      }, 0) || 0

      setPlatformStats({
        totalConferences: allConferences?.length || 0,
        totalUsers: allUsers?.length || 0,
        totalRegistrations: allRegistrations?.length || 0,
        conferenceTurnover,
        activeConferences,
      })
    } catch (error) {
      console.error('Error loading platform stats:', error)
    }

    // Platform's own income (subscriptions) is separate from conference turnover
    try {
      const res = await fetch('/api/admin/platform-revenue')
      if (res.ok) {
        const data = await res.json()
        setPlatformRevenue({
          mrr: data.mrr || 0,
          currency: data.currency || 'EUR',
          activeCount: data.activeCount || 0,
          pendingOrderCount: data.pendingOrders?.length || 0,
        })
      }
    } catch (error) {
      console.error('Error loading platform revenue:', error)
    }
  }

  useEffect(() => {
    if (conferenceLoading) return // Wait for conferences to load

    if (currentConference) {
      loadStats()
    } else {
      // No conference selected - clear previous conference's stats/charts so
      // the "All Conferences" overview never shows stale numbers from
      // whichever conference was last selected (the Stats Grid/Analytics
      // section below is only meaningful for a single selected conference).
      setStats({
        totalRegistrations: 0,
        paidRegistrations: 0,
        pendingPayments: 0,
        checkedIn: 0,
        recentRegistrations: [],
        trends: {
          totalRegistrations: undefined,
          paidRegistrations: undefined,
          pendingPayments: undefined,
        },
      })
      setChartData({
        registrationsByDay: [],
        paymentStatus: [],
        registrationsByCountry: [],
        revenueByPeriod: [],
      })
      setNewAnalyticsData((prev) => ({
        ...prev,
        registrationsByType: [],
        abstractStats: { submitted: 0, accepted: 0, rejected: 0, pending: 0 },
        checkInData: {
          totalRegistrations: 0,
          checkedIn: 0,
          notCheckedIn: 0,
          checkInRate: 0,
          noShowRate: 0,
        },
        revenueBreakdown: { ...prev.revenueBreakdown, total: 0, byTicketType: [], byPaymentMethod: [], averageTransaction: 0, todayRevenue: 0, weekRevenue: 0, monthRevenue: 0 },
        engagement: { popularAccommodations: [], customFieldsUsage: [] },
        comparison: { ...prev.comparison, currentConference: { name: '', registrations: 0, revenue: 0, avgTicketPrice: 0 } },
      }))

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
  // Shown only when the super admin explicitly selects the platform view
  if (isSuperAdmin && !isImpersonating && !currentConference && viewMode === 'platform') {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{t('platformOverview')}</h2>
          <p className="mt-2 text-gray-600">{t('welcomeBack', { name: profile?.full_name || 'Super Admin' })}</p>
        </div>

        {/* Action queue comes first: it contains only work that needs a decision,
            not another collection of historical totals. */}
        {(platformRevenue.pendingOrderCount > 0 || inquiryStats.newInquiries > 0) && (
          <section className="mb-8">
            <div className="flex items-end justify-between gap-4 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('needsAttention')}</h3>
                <p className="text-sm text-gray-600">{t('needsAttentionHint')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platformRevenue.pendingOrderCount > 0 && (
                <Link
                  href="/admin/subscriptions"
                  className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100"
                >
                  <div>
                    <p className="font-semibold text-amber-950">{t('pendingSubscriptionOrders')}</p>
                    <p className="text-sm text-amber-800 mt-1">
                      {t('pendingSubscriptionOrdersHint', {
                        count: platformRevenue.pendingOrderCount,
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-sm font-bold text-amber-900">
                    {platformRevenue.pendingOrderCount}
                  </span>
                </Link>
              )}
              {inquiryStats.newInquiries > 0 && (
                <Link
                  href="/admin/inquiries"
                  className="flex items-center justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
                >
                  <div>
                    <p className="font-semibold text-blue-950">{t('newInquiries')}</p>
                    <p className="text-sm text-blue-800 mt-1">
                      {t('newInquiriesHint', { count: inquiryStats.newInquiries })}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-200 px-3 py-1 text-sm font-bold text-blue-900">
                    {inquiryStats.newInquiries}
                  </span>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Financial figures are deliberately separated from activity metrics:
            conference turnover is organizers' money, while MRR is MeetFlow income. */}
        <section className="mb-8">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('platformBusiness')}</h3>
              <p className="text-sm text-gray-600">{t('platformBusinessHint')}</p>
            </div>
            <Link
              href="/admin/subscriptions"
              className="hidden sm:inline-flex text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('manageSubscriptions')}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link href="/admin/subscriptions" className="block">
              <StatsCard
                title={t('platformRevenueMrr')}
                value={formatCurrency(platformRevenue.mrr, platformRevenue.currency)}
                color="green"
                icon={<DollarSign className="w-5 h-5" />}
              />
            </Link>
            <Link href="/admin/subscriptions" className="block">
              <StatsCard
                title={t('activeSubscriptions')}
                value={platformRevenue.activeCount}
                color="purple"
                icon={<CreditCard className="w-5 h-5" />}
              />
            </Link>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{t('platformActivity')}</h3>
            <p className="text-sm text-gray-600">{t('platformActivityHint')}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatsCard
              title={t('totalConferences')}
              value={platformStats.totalConferences}
              color="blue"
              icon={<Building2 className="w-5 h-5" />}
            />
            <StatsCard
              title={t('activeConferences')}
              value={platformStats.activeConferences}
              color="green"
              icon={<Activity className="w-5 h-5" />}
            />
            <StatsCard
              title={t('totalUsers')}
              value={platformStats.totalUsers}
              color="purple"
              icon={<UsersIcon className="w-5 h-5" />}
            />
            <StatsCard
              title={t('totalRegistrations')}
              value={platformStats.totalRegistrations}
              color="blue"
              icon={<UsersIcon className="w-5 h-5" />}
            />
            <StatsCard
              title={t('conferenceTurnover')}
              value={formatCurrency(platformStats.conferenceTurnover, 'EUR')}
              color="yellow"
              icon={<CreditCard className="w-5 h-5" />}
            />
          </div>
          <p className="mt-3 text-sm text-gray-500">{t('conferenceTurnoverHint')}</p>
        </section>

        {/* Quick Actions – one primary + calm secondary links */}
        <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('quickActions')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-3">
            <Link
              href="/admin/conferences/new"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              {t('createConference')}
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <UsersIcon className="w-4 h-4" />
              {t('manageUsers')}
            </Link>
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Mail className="w-4 h-4" />
              {t('viewInquiries')}
              {inquiryStats.newInquiries > 0 && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-800">
                  {inquiryStats.newInquiries}
                </span>
              )}
            </Link>
            <Link
              href="/admin/conferences"
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <BarChart3 className="w-4 h-4" />
              {t('allConferencesLink')}
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{t('noConferenceAdminsFound')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('createConferenceAdminsHint')}</p>
                  </div>
                  <Link
                    href="/admin/users/new"
                    className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
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
              <div className="divide-y divide-gray-100">
                {conferences.slice(0, 5).map((conf) => (
                  <Link
                    key={conf.id}
                    href={`/admin/conferences/${conf.id}/settings`}
                    className="flex items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-gray-50/80"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-gray-900">{conf.name}</h4>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {conf.location || t('noLocationSet')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge tone={conf.published ? 'success' : 'neutral'}>
                        {conf.published ? t('published') : t('draft')}
                      </StatusBadge>
                      <Eye className="h-4 w-4 text-gray-400" />
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

  const eventTypeLabel = (eventType?: string | null) => {
    switch (eventType) {
      case 'conference':
        return t('eventTypeConference')
      case 'workshop':
        return t('eventTypeWorkshop')
      case 'seminar':
        return t('eventTypeSeminar')
      case 'webinar':
        return t('eventTypeWebinar')
      case 'training':
        return t('eventTypeTraining')
      default:
        return t('eventTypeOther')
    }
  }

  const eventTypeTone = (eventType?: string | null): StatusBadgeTone => {
    switch (eventType) {
      case 'workshop':
        return 'violet'
      case 'seminar':
        return 'success'
      case 'webinar':
        return 'warning'
      case 'training':
        return 'info'
      case 'conference':
        return 'info'
      default:
        return 'neutral'
    }
  }

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
            {/* View Mode Toggle - multiple conferences or super admin (platform view) */}
            {(conferences.length > 1 || (isSuperAdmin && !isImpersonating)) && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                {isSuperAdmin && !isImpersonating && (
                  <button
                    onClick={() => {
                      setViewMode('platform')
                      setCurrentConference(null)
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'platform'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Globe className="w-4 h-4 inline mr-2" />
                    {t('platformView')}
                  </button>
                )}
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
          <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchConferencesPlaceholder')}
                  value={conferenceSearchTerm}
                  onChange={(e) => setConferenceSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-9 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                {conferenceSearchTerm && (
                  <button
                    onClick={() => setConferenceSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-md border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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

          <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {t('allEventsCount', { count: filteredConferences.length })}
                </h3>
                {eventTypeFilter !== 'all' && (
                  <p className="text-xs text-gray-500">
                    {t('filteredBy', { type: eventTypeFilter })}
                  </p>
                )}
              </div>
              <Link
                href="/admin/conferences"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {t('manageAll')}
              </Link>
            </div>
            {loadingConferenceStats ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-2 h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="text-sm text-gray-500">{t('loadingStatistics')}</p>
              </div>
            ) : filteredConferences.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Building2 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">
                  {eventTypeFilter !== 'all' || conferenceSearchTerm
                    ? t('noEventsMatch')
                    : t('noEventsFound')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('eventHeader')}
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('typeHeader')}
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {c('status')}
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('registrationsHeader')}
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('paid')}
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('statusPending')}
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('checkedIn')}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('actionsHeader')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
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
                          className="cursor-pointer hover:bg-gray-50/80"
                          onClick={() => {
                            setCurrentConference(conf)
                            setViewMode('single')
                          }}
                        >
                          <td className="px-4 py-2.5">
                            <div className="min-w-0">
                              <div className="truncate font-medium text-gray-900">
                                {conf.name}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                {conf.location || t('noLocationSet')}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <StatusBadge tone={eventTypeTone(conf.event_type)}>
                              {eventTypeLabel(conf.event_type)}
                            </StatusBadge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <StatusBadge tone={conf.published ? 'success' : 'neutral'}>
                              {conf.published ? t('published') : t('draft')}
                            </StatusBadge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-center font-medium text-gray-900">
                            {confStats.totalRegistrations}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-center text-emerald-700">
                            {confStats.paidRegistrations}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-center text-amber-700">
                            {confStats.pendingPayments}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-center text-blue-700">
                            {confStats.checkedIn}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentConference(conf)
                                setViewMode('single')
                              }}
                              className="mr-3 font-medium text-blue-600 hover:text-blue-700"
                            >
                              {t('viewDetails')}
                            </button>
                            <Link
                              href={`/admin/conferences/${conf.id}/settings`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-500 hover:text-gray-800"
                            >
                              <Settings className="inline h-4 w-4" />
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

      {/* Quick Actions – compact operational toolbar */}
      {currentConference && !shouldShowOverview && (
        <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('quickActions')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-3">
            <Link
              href="/admin/registrations"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <UsersIcon className="w-4 h-4" />
              {t('registrationsLabel')}
            </Link>
            <Link
              href="/admin/abstracts"
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <FileText className="w-4 h-4" />
              {t('abstractsLabel')}
            </Link>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <CreditCard className="w-4 h-4" />
              {t('paymentsLabel')}
              {stats.pendingPayments > 0 && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                  {stats.pendingPayments}
                </span>
              )}
            </Link>
            <Link
              href={`/admin/conferences/${currentConference.id}/settings`}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              {t('settings')}
            </Link>
            <Link
              href="/admin/tickets"
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Ticket className="w-4 h-4" />
              {t('ticketsLabel')}
              {openTicketsCount !== null && openTicketsCount > 0 ? ` (${openTicketsCount})` : ''}
            </Link>
          </div>
        </div>
      )}

      {/* Team (Conference Admins) – table with Avatar (Telerik-style) */}
      {isSuperAdmin && !isImpersonating && !currentConference && (
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

      {currentConference && !shouldShowOverview && (
      <>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">{t('conferenceSnapshot')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('conferenceSnapshotHint')}</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/registrations" className="block">
          <StatsCard
            title={t('totalRegistrations')}
            value={stats.totalRegistrations}
            trend={stats.trends.totalRegistrations}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </Link>
        <Link href="/admin/payments" className="block">
          <StatsCard
            title={t('paid')}
            value={stats.paidRegistrations}
            trend={stats.trends.paidRegistrations}
            color="green"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </Link>
        <Link href="/admin/payments" className="block">
          <StatsCard
            title={t('pendingPayments')}
            value={stats.pendingPayments}
            trend={stats.trends.pendingPayments}
            hint={stats.pendingPayments > 0 ? t('pendingNeedsReview') : undefined}
            color="yellow"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </Link>
        <Link href="/admin/checkin" className="block">
          <StatsCard
            title={t('checkedIn')}
            value={stats.checkedIn || 0}
            color="blue"
            hint={
              stats.totalRegistrations > 0
                ? t('checkInRateHint', {
                    rate: Math.round(
                      ((stats.checkedIn || 0) / stats.totalRegistrations) * 100
                    ),
                  })
                : undefined
            }
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </Link>
      </div>

      {/* Operational table first — same pattern as real admin panels */}
      <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('recentRegistrations')}</h3>
            <p className="text-xs text-gray-500">{t('recentRegistrationsHint')}</p>
          </div>
          <Link
            href="/admin/registrations"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {t('viewAllLink')}
          </Link>
        </div>
        {stats.recentRegistrations.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            {t('noRegistrationsYet')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('member')}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('email')}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {c('status')}
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('dateHeader')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {stats.recentRegistrations.map((reg) => {
                  const contact = extractContact(reg)
                  const displayName =
                    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
                    reg.registration_number ||
                    t('noName')
                  return (
                    <tr key={reg.id} className="hover:bg-gray-50/80">
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={displayName} email={contact.email} size="sm" />
                          <span className="font-medium text-gray-900">{displayName}</span>
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-2.5 text-gray-600">
                        {contact.email || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <PaymentStatusBadge
                          status={reg.payment_status || 'pending'}
                          labels={{
                            paid: t('paid'),
                            pending: t('statusPending'),
                            notRequired: t('statusNotRequired'),
                          }}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right text-gray-500">
                        {new Date(reg.created_at).toLocaleDateString('hr-HR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics & Insights – secondary, collapsed by default */}
      <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
          className="flex w-full items-center justify-between bg-gray-50/80 px-4 py-3 text-left transition-colors hover:bg-gray-100"
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('analyticsInsights')}</h3>
            <p className="text-xs text-gray-500">{t('analyticsInsightsHint')}</p>
          </div>
          {analyticsExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {analyticsExpanded && (
          <div className="space-y-6 border-t border-gray-200 p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {chartData.registrationsByDay.length > 0 && (
                <RegistrationsByDayChart data={chartData.registrationsByDay} />
              )}
              {chartData.paymentStatus.length > 0 && (
                <PaymentStatusChart data={chartData.paymentStatus} />
              )}
            </div>

            {chartData.revenueByPeriod.length > 0 && (
              <RevenueByPeriodChart data={chartData.revenueByPeriod} />
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {newAnalyticsData.registrationsByType.length > 0 && (
                <RegistrationsByTypeChart data={newAnalyticsData.registrationsByType} />
              )}
              {newAnalyticsData.checkInData.totalRegistrations > 0 && (
                <CheckInAnalytics data={newAnalyticsData.checkInData} />
              )}
            </div>

            {(newAnalyticsData.revenueBreakdown.total > 0 ||
              (newAnalyticsData.revenueBreakdown.vatPercentage &&
                newAnalyticsData.revenueBreakdown.vatPercentage > 0)) && (
              <RevenueBreakdown data={newAnalyticsData.revenueBreakdown} />
            )}

            {newAnalyticsData.abstractStats.submitted > 0 && (
              <AbstractSubmissionStats data={newAnalyticsData.abstractStats} />
            )}

            {(newAnalyticsData.engagement.popularAccommodations.length > 0 ||
              newAnalyticsData.engagement.customFieldsUsage.length > 0) && (
              <EngagementMetrics data={newAnalyticsData.engagement} />
            )}

            {newAnalyticsData.comparison.currentConference.registrations > 0 && (
              <ComparisonInsights data={newAnalyticsData.comparison} />
            )}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  )
}
