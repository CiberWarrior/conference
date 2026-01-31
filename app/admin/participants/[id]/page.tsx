'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { ArrowLeft, Mail, Phone, MapPin, Building2, Award, Calendar, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react'
import { formatPriceWithoutZeros } from '@/utils/pricing'

interface ParticipantDetail {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  country?: string
  institution?: string
  has_account: boolean
  loyalty_tier: string
  loyalty_points: number
  total_events_attended: number
  created_at: string
  account_activated_at?: string
}

interface RegistrationDetail {
  id: string
  registration_number?: string
  conference: {
    id: string
    name: string
    slug: string
    event_type?: string
    start_date?: string
    end_date?: string
    location?: string
  }
  status: string
  payment_status: string
  amount_paid?: number
  currency?: string
  registered_at: string
  checked_in: boolean
  checked_in_at?: string
  certificate_issued_at?: string
}

interface LoyaltyDiscount {
  id: string
  discount_type: string
  discount_percentage?: number
  discount_amount?: number
  applied: boolean
  applied_at?: string
  created_at: string
}

export default function AdminParticipantDetailPage() {
  const t = useTranslations('admin.participants')
  const c = useTranslations('admin.common')
  const { user, profile, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const participantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [participant, setParticipant] = useState<ParticipantDetail | null>(null)
  const [registrations, setRegistrations] = useState<RegistrationDetail[]>([])
  const [discounts, setDiscounts] = useState<LoyaltyDiscount[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    country: '',
    institution: '',
  })

  const fetchParticipantDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/participants/${participantId}`)
      if (response.ok) {
        const data = await response.json()
        setParticipant(data.participant)
        setRegistrations(data.registrations || [])
        setDiscounts(data.discounts || [])
        setEditData({
          first_name: data.participant.first_name,
          last_name: data.participant.last_name,
          phone: data.participant.phone || '',
          country: data.participant.country || '',
          institution: data.participant.institution || '',
        })
      } else {
        console.error('Failed to fetch participant details')
      }
    } catch (error) {
      console.error('Error fetching participant details:', error)
    } finally {
      setLoading(false)
    }
  }, [participantId])

  useEffect(() => {
    if (!authLoading && user) {
      fetchParticipantDetails()
    }
  }, [authLoading, user, fetchParticipantDetails])

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/admin/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        await fetchParticipantDetails()
        setIsEditing(false)
      } else {
        console.error('Failed to update participant')
      }
    } catch (error) {
      console.error('Error updating participant:', error)
    }
  }

  const getLoyaltyColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-orange-100 text-orange-800 border-orange-300'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">{t('statusConfirmed')}</span>
      case 'cancelled':
        return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-300">{t('statusCancelled')}</span>
      case 'attended':
        return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">{t('statusAttended')}</span>
      case 'no_show':
        return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-300">{t('statusNoShow')}</span>
      default:
        return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{t('statusUnknown')}</span>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('paymentPaid')}</span>
      case 'pending':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{t('paymentPending')}</span>
      case 'not_required':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{t('paymentNotRequired')}</span>
      default:
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!participant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t('participantNotFound')}</p>
        <Link href="/admin/participants" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          {t('backToParticipantsShort')}
        </Link>
      </div>
    )
  }

  // Calculate stats
  const totalPaid = registrations.reduce((sum, reg) => sum + (reg.amount_paid || 0), 0)
  const attendedCount = registrations.filter(r => r.status === 'attended').length
  const upcomingCount = registrations.filter(r => r.status === 'confirmed').length

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/participants"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToParticipants')}
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {participant.first_name[0]}{participant.last_name[0]}
            </div>

            {/* Info */}
            <div>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={editData.first_name}
                      onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={t('firstNamePlaceholder')}
                    />
                    <input
                      type="text"
                      value={editData.last_name}
                      onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={t('lastNamePlaceholder')}
                    />
                  </div>
                  <input
                    type="text"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder={t('phonePlaceholder')}
                  />
                  <input
                    type="text"
                    value={editData.country}
                    onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder={t('countryPlaceholder')}
                  />
                  <input
                    type="text"
                    value={editData.institution}
                    onChange={(e) => setEditData({ ...editData, institution: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder={t('institutionPlaceholder')}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {c('save')}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      {c('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {participant.first_name} {participant.last_name}
                  </h1>
                  <div className="space-y-1 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{participant.email}</span>
                    </div>
                    {participant.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{participant.phone}</span>
                      </div>
                    )}
                    {participant.country && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{participant.country}</span>
                      </div>
                    )}
                    {participant.institution && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{participant.institution}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Edit Button and Badges */}
          <div className="flex flex-col items-end gap-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                {c('edit')}
              </button>
            )}
            <div className="flex gap-2">
              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getLoyaltyColor(participant.loyalty_tier)}`}>
                {['platinum', 'gold', 'silver', 'bronze'].includes(participant.loyalty_tier)
                  ? t(participant.loyalty_tier as 'platinum' | 'gold' | 'silver' | 'bronze')
                  : participant.loyalty_tier}
              </span>
              {participant.has_account ? (
                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
                  {t('hasAccount')}
                </span>
              ) : (
                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-300">
                  {t('guest')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('totalRegistrations')}</p>
              <p className="text-3xl font-bold text-gray-900">{registrations.length}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('attendedEvents')}</p>
              <p className="text-3xl font-bold text-green-600">{attendedCount}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('totalPaid')}</p>
              <p className="text-3xl font-bold text-gray-900">
                {registrations[0]?.currency || '€'}{formatPriceWithoutZeros(totalPaid)}
              </p>
            </div>
            <Award className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('loyaltyPoints')}</p>
              <p className="text-3xl font-bold text-purple-600">{participant.loyalty_points}</p>
            </div>
            <Award className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t('registrationHistory')}</h2>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t('noRegistrationsYet')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('regNumber')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('conference')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payment')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('checkIn')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-blue-600">
                        {reg.registration_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{reg.conference.name}</div>
                        {reg.conference.event_type && (
                          <div className="text-xs text-gray-500 capitalize">{reg.conference.event_type}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(reg.registered_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(reg.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(reg.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reg.amount_paid ? `${reg.currency || '€'}${formatPriceWithoutZeros(reg.amount_paid)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reg.checked_in ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loyalty Discounts */}
      {discounts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('loyaltyDiscounts')}</h2>
          <div className="space-y-3">
            {discounts.map((discount) => (
              <div key={discount.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {discount.discount_type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {discount.discount_percentage && `${discount.discount_percentage}% off`}
                    {discount.discount_amount && `€${discount.discount_amount} off`}
                  </p>
                </div>
                <div className="text-right">
                  {discount.applied ? (
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {t('applied')}
                    </span>
                  ) : (
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {t('available')}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(discount.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
