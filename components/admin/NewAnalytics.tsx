'use client'

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getPriceBreakdown, formatPrice } from '@/utils/pricing'

// Colors for charts
const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
}

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// 3. Registrations by Type Chart
interface RegistrationTypeData {
  type: string
  count: number
  percentage?: number
}

export function RegistrationsByTypeChart({ data }: { data: RegistrationTypeData[] }) {
  return (
    <ChartCard title="Registrations by Type">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="type" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="count" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// 4. Abstract Submission Analytics
interface AbstractStatsData {
  submitted: number
  accepted: number
  rejected: number
  pending: number
}

export function AbstractSubmissionStats({ data }: { data: AbstractStatsData }) {
  const pieData = [
    { name: 'Accepted', value: data.accepted, color: COLORS.success },
    { name: 'Pending', value: data.pending, color: COLORS.warning },
    { name: 'Rejected', value: data.rejected, color: COLORS.danger },
  ].filter(item => item.value > 0)

  const acceptanceRate = data.submitted > 0 
    ? ((data.accepted / data.submitted) * 100).toFixed(1) 
    : '0.0'

  return (
    <ChartCard title="Abstract Submission Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Submitted</p>
            <p className="text-3xl font-bold text-gray-900">{data.submitted}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Accepted</p>
              <p className="text-2xl font-semibold text-green-600">{data.accepted}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-semibold text-yellow-600">{data.pending}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Acceptance Rate</p>
            <p className="text-2xl font-semibold text-blue-600">{acceptanceRate}%</p>
          </div>
        </div>
        {pieData.length > 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  )
}

// 5. Check-in Analytics
interface CheckInData {
  totalRegistrations: number
  checkedIn: number
  notCheckedIn: number
  checkInRate: number
  noShowRate: number
}

export function CheckInAnalytics({ data }: { data: CheckInData }) {
  const pieData = [
    { name: 'Checked In', value: data.checkedIn, color: COLORS.success },
    { name: 'Not Checked In', value: data.notCheckedIn, color: COLORS.warning },
  ].filter(item => item.value > 0)

  return (
    <ChartCard title="Check-in Status">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Check-in Rate</p>
            <p className="text-4xl font-bold text-green-600">{data.checkInRate.toFixed(1)}%</p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all" 
                style={{ width: `${data.checkInRate}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Checked In</p>
              <p className="text-2xl font-bold text-green-700">{data.checkedIn}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{data.notCheckedIn}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">No-Show Rate</p>
            <p className="text-xl font-semibold text-red-600">{data.noShowRate.toFixed(1)}%</p>
          </div>
        </div>
        {pieData.length > 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  )
}

// 6. Revenue Breakdown
interface RevenueBreakdownData {
  total: number
  byTicketType: { type: string; amount: number }[]
  byPaymentMethod: { method: string; amount: number }[]
  averageTransaction: number
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  vatPercentage?: number // PDV postotak (opcionalno)
  currency?: string // Valuta (default: EUR)
}

export function RevenueBreakdown({ data }: { data: RevenueBreakdownData }) {
  const currency = data.currency || 'EUR'
  const vatPercentage = data.vatPercentage
  const showVAT = vatPercentage && vatPercentage > 0

  // Helper function to format revenue with VAT info
  const formatRevenue = (amount: number) => {
    if (!showVAT) {
      return formatPrice(amount, currency)
    }
    const breakdown = getPriceBreakdown(amount, vatPercentage)
    return (
      <div className="space-y-0.5">
        <div className="text-lg font-bold">{formatPrice(breakdown.withVAT, currency)}</div>
        <div className="text-xs text-gray-500">
          {formatPrice(breakdown.withoutVAT, currency)} bez PDV-a
        </div>
      </div>
    )
  }

  return (
    <ChartCard title="Revenue Breakdown">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Today</p>
            {showVAT ? (
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-blue-700">
                  {formatPrice(getPriceBreakdown(data.todayRevenue, vatPercentage).withVAT, currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPrice(getPriceBreakdown(data.todayRevenue, vatPercentage).withoutVAT, currency)} bez PDV-a
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold text-blue-700">{formatPrice(data.todayRevenue, currency)}</p>
            )}
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">This Week</p>
            {showVAT ? (
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-green-700">
                  {formatPrice(getPriceBreakdown(data.weekRevenue, vatPercentage).withVAT, currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPrice(getPriceBreakdown(data.weekRevenue, vatPercentage).withoutVAT, currency)} bez PDV-a
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold text-green-700">{formatPrice(data.weekRevenue, currency)}</p>
            )}
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">This Month</p>
            {showVAT ? (
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-purple-700">
                  {formatPrice(getPriceBreakdown(data.monthRevenue, vatPercentage).withVAT, currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPrice(getPriceBreakdown(data.monthRevenue, vatPercentage).withoutVAT, currency)} bez PDV-a
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold text-purple-700">{formatPrice(data.monthRevenue, currency)}</p>
            )}
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Avg Transaction</p>
            {showVAT ? (
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-indigo-700">
                  {formatPrice(getPriceBreakdown(data.averageTransaction, vatPercentage).withVAT, currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPrice(getPriceBreakdown(data.averageTransaction, vatPercentage).withoutVAT, currency)} bez PDV-a
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold text-indigo-700">{formatPrice(data.averageTransaction, currency)}</p>
            )}
          </div>
        </div>

        {/* Total Revenue with VAT breakdown */}
        {showVAT && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Ukupan Revenue</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatPrice(getPriceBreakdown(data.total, vatPercentage).withVAT, currency)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatPrice(getPriceBreakdown(data.total, vatPercentage).withoutVAT, currency)} bez PDV-a
                  {' • '}
                  PDV ({vatPercentage}%): {formatPrice(getPriceBreakdown(data.total, vatPercentage).vatAmount, currency)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Ticket Type */}
          {data.byTicketType.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">By Ticket Type</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.byTicketType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill={COLORS.primary} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Payment Method */}
          {data.byPaymentMethod.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">By Payment Method</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.byPaymentMethod}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="amount"
                    label={(entry) => entry.method}
                  >
                    {data.byPaymentMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  )
}

// 8. Engagement Metrics
interface EngagementData {
  popularAccommodations: { hotel: string; count: number }[]
  customFieldsUsage: { field: string; usage: number }[]
}

export function EngagementMetrics({ data }: { data: EngagementData }) {
  return (
    <ChartCard title="Engagement Metrics">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Popular Accommodations */}
        {data.popularAccommodations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Popular Accommodations</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.popularAccommodations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="hotel" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.purple} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Custom Fields Usage */}
        {data.customFieldsUsage.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom Fields Usage</h4>
            <div className="space-y-3">
              {data.customFieldsUsage.map((field, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{field.field}</span>
                    <span className="font-semibold">{field.usage}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all" 
                      style={{ width: `${field.usage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  )
}

// 9. Comparison Insights
interface ComparisonData {
  currentConference: {
    name: string
    registrations: number
    revenue: number
    avgTicketPrice: number
  }
  previousConference?: {
    name: string
    registrations: number
    revenue: number
    avgTicketPrice: number
  }
  projectedTarget?: {
    registrations: number
    revenue: number
  }
  progress?: {
    registrations: number // percentage
    revenue: number // percentage
  }
}

export function ComparisonInsights({ data }: { data: ComparisonData }) {
  const hasComparison = data.previousConference !== undefined
  const hasProjection = data.projectedTarget !== undefined

  return (
    <ChartCard title="Comparison & Insights">
      <div className="space-y-6">
        {/* Current vs Previous */}
        {hasComparison && data.previousConference && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">vs Previous Conference</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{data.currentConference.registrations}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Previous: {data.previousConference.registrations}
                  <span className={`ml-2 font-semibold ${
                    data.currentConference.registrations >= data.previousConference.registrations 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {data.currentConference.registrations >= data.previousConference.registrations ? '↑' : '↓'}
                    {Math.abs(((data.currentConference.registrations - data.previousConference.registrations) / data.previousConference.registrations * 100)).toFixed(1)}%
                  </span>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">€{data.currentConference.revenue.toFixed(0)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Previous: €{data.previousConference.revenue.toFixed(0)}
                  <span className={`ml-2 font-semibold ${
                    data.currentConference.revenue >= data.previousConference.revenue 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {data.currentConference.revenue >= data.previousConference.revenue ? '↑' : '↓'}
                    {Math.abs(((data.currentConference.revenue - data.previousConference.revenue) / data.previousConference.revenue * 100)).toFixed(1)}%
                  </span>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Avg Ticket Price</p>
                <p className="text-2xl font-bold text-gray-900">€{data.currentConference.avgTicketPrice.toFixed(0)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Previous: €{data.previousConference.avgTicketPrice.toFixed(0)}
                  <span className={`ml-2 font-semibold ${
                    data.currentConference.avgTicketPrice >= data.previousConference.avgTicketPrice 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {data.currentConference.avgTicketPrice >= data.previousConference.avgTicketPrice ? '↑' : '↓'}
                    {Math.abs(((data.currentConference.avgTicketPrice - data.previousConference.avgTicketPrice) / data.previousConference.avgTicketPrice * 100)).toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress vs Target */}
        {hasProjection && data.projectedTarget && data.progress && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Progress vs Target</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Registrations</span>
                  <span className="font-semibold">
                    {data.currentConference.registrations} / {data.projectedTarget.registrations} 
                    <span className="ml-2 text-blue-600">({data.progress.registrations.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all" 
                    style={{ width: `${Math.min(data.progress.registrations, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Revenue</span>
                  <span className="font-semibold">
                    €{data.currentConference.revenue.toFixed(0)} / €{data.projectedTarget.revenue.toFixed(0)}
                    <span className="ml-2 text-green-600">({data.progress.revenue.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all" 
                    style={{ width: `${Math.min(data.progress.revenue, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  )
}
