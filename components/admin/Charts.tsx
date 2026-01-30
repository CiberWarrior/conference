'use client'

import { useTranslations } from 'next-intl'
import {
  LineChart,
  Line,
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

// Colors for charts
const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
}

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

interface RegistrationsByDayData {
  date: string
  count: number
}

interface PaymentStatusData {
  name: string
  value: number
  [key: string]: string | number
}

interface CountryData {
  country: string
  count: number
}

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

// Registrations by Day Chart
export function RegistrationsByDayChart({ data }: { data: RegistrationsByDayData[] }) {
  const t = useTranslations('admin.analytics')
  return (
    <ChartCard title={t('registrationsByDay')}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke={COLORS.primary}
            strokeWidth={2}
            name={t('registrations')}
            dot={{ fill: COLORS.primary, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Payment Status Pie Chart — status names (Paid, Pending, Not Required) translated via t()
export function PaymentStatusChart({ data }: { data: PaymentStatusData[] }) {
  const t = useTranslations('admin.analytics')
  const statusKey = (name: string) =>
    name === 'Paid' ? 'paymentPaid' : name === 'Pending' ? 'paymentPending' : 'paymentNotRequired'
  const displayData = data.map((d) => ({
    ...d,
    name: t(statusKey(d.name as string)),
  }))
  return (
    <ChartCard title={t('paymentStatusDistribution')}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Registrations by Country Chart
export function RegistrationsByCountryChart({ data }: { data: CountryData[] }) {
  const t = useTranslations('admin.analytics')
  const topCountries = data.slice(0, 10)

  return (
    <ChartCard title={t('registrationsByCountryTop10')}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={topCountries} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            dataKey="country"
            type="category"
            width={120}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend />
          <Bar dataKey="count" fill={COLORS.primary} name={t('registrations')} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Revenue by Period Chart (if payment data is available)
export function RevenueByPeriodChart({
  data,
}: {
  data: { period: string; revenue: number }[]
}) {
  const t = useTranslations('admin.analytics')
  return (
    <ChartCard title={t('revenueByPeriod')}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `€${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
            formatter={(value: number) => [`€${value.toFixed(2)}`, t('revenue')]}
          />
          <Legend />
          <Bar dataKey="revenue" fill={COLORS.success} name={t('revenue')} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

