'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { useConference } from '@/contexts/ConferenceContext'
import { supabase } from '@/lib/supabase'
import { showSuccess, showError } from '@/utils/toast'
import {
  Mail,
  Building2,
  Phone,
  Key,
  Save,
  Edit,
  X,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/admin/Avatar'
import StatusBadge from '@/components/admin/StatusBadge'

export default function AccountPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { conferences } = useConference()
  const t = useTranslations('admin.account')
  const c = useTranslations('admin.common')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Profile form state
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    phone: '',
  })
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  
  // VAT settings state
  const [isEditingVAT, setIsEditingVAT] = useState(false)
  const [vatData, setVatData] = useState({
    default_vat_percentage: '',
    vat_label: '',
  })
  const [savingVAT, setSavingVAT] = useState(false)
  
  // Bank Account settings state
  const [isEditingBank, setIsEditingBank] = useState(false)
  const [bankData, setBankData] = useState({
    bank_account_number: '',
    bank_account_holder: '',
    bank_name: '',
    swift_bic: '',
    bank_address: '',
    bank_account_currency: 'EUR',
  })
  const [savingBank, setSavingBank] = useState(false)
  
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        organization: profile.organization || '',
        phone: profile.phone || '',
      })
      setVatData({
        default_vat_percentage: profile.default_vat_percentage?.toString() || '',
        vat_label: profile.vat_label || '',
      })
      setBankData({
        bank_account_number: profile.bank_account_number || '',
        bank_account_holder: profile.bank_account_holder || '',
        bank_name: profile.bank_name || '',
        swift_bic: profile.swift_bic || '',
        bank_address: profile.bank_address || '',
        bank_account_currency: profile.bank_account_currency || 'EUR',
      })
    }
    setLoading(false)
  }, [profile])

  const handleSaveProfile = async () => {
    if (!user?.id) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          organization: formData.organization,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      setIsEditing(false)
      showSuccess(t('profileUpdated'))
    } catch (error) {
      console.error('Error updating profile:', error)
      showError(t('failedToUpdateProfile'))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveVAT = async () => {
    if (!user?.id) return

    try {
      setSavingVAT(true)
      const { error } = await supabase
        .from('user_profiles')
        .update({
          default_vat_percentage: vatData.default_vat_percentage 
            ? parseFloat(vatData.default_vat_percentage) 
            : null,
          vat_label: vatData.vat_label || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      setIsEditingVAT(false)
      showSuccess(t('vatUpdated'))
    } catch (error) {
      console.error('Error updating VAT settings:', error)
      showError(t('failedToUpdateVat'))
    } finally {
      setSavingVAT(false)
    }
  }

  const handleSaveBank = async () => {
    if (!user?.id) return

    try {
      setSavingBank(true)
      const { error } = await supabase
        .from('user_profiles')
        .update({
          bank_account_number: bankData.bank_account_number || null,
          bank_account_holder: bankData.bank_account_holder || null,
          bank_name: bankData.bank_name || null,
          swift_bic: bankData.swift_bic || null,
          bank_address: bankData.bank_address || null,
          bank_account_currency: bankData.bank_account_currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      setIsEditingBank(false)
      showSuccess(t('bankUpdated'))
    } catch (error) {
      console.error('Error updating bank settings:', error)
      showError(t('failedToUpdateBank'))
    } finally {
      setSavingBank(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user?.id) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError(t('passwordsDoNotMatch'))
      return
    }

    if (passwordData.newPassword.length < 8) {
      showError(t('passwordMinLength'))
      return
    }

    try {
      setChangingPassword(true)

      // Update password via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPasswordForm(false)
      showSuccess(t('passwordChanged'))
    } catch (error: any) {
      console.error('Error changing password:', error)
      showError(error.message || t('failedToChangePassword'))
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingAccount')}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profileNotFound')}</h2>
          <p className="text-gray-600">{t('unableToLoadProfile')}</p>
        </div>
      </div>
    )
  }

  const roleLabel =
    profile.role === 'super_admin' ? t('roleSuperAdmin') : t('roleConferenceAdmin')

  const fieldClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
  const readonlyClass =
    'w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700'
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'

  return (
    <div className="space-y-6">
      {/* Who am I — only what MeetFlow needs */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={profile.full_name || profile.email}
              email={profile.email}
              size="lg"
            />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-gray-900">
                {profile.full_name || t('title')}
              </h1>
              <p className="truncate text-sm text-gray-500">{profile.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge tone={profile.role === 'super_admin' ? 'warning' : 'info'}>
                  {roleLabel}
                </StatusBadge>
                <StatusBadge tone={profile.active ? 'success' : 'neutral'}>
                  {profile.active ? t('active') : t('inactive')}
                </StatusBadge>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 sm:max-w-xs sm:text-right">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Information */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{t('profileInformation')}</h2>
                <p className="text-xs text-gray-500">{t('yourPersonalDetails')}</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4" />
                  {c('edit')}
                </button>
              )}
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className={labelClass}>
                  <Mail className="mr-1 inline h-3.5 w-3.5" />
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className={`${readonlyClass} cursor-not-allowed`}
                />
                <p className="mt-1 text-xs text-gray-500">{t('emailCannotBeChanged')}</p>
              </div>

              <div>
                <label className={labelClass}>{t('fullName')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={fieldClass}
                    placeholder={t('yourFullName')}
                  />
                ) : (
                  <p className={readonlyClass}>{profile.full_name || t('notSet')}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  <Building2 className="mr-1 inline h-3.5 w-3.5" />
                  {t('organization')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className={fieldClass}
                    placeholder={t('yourOrganization')}
                  />
                ) : (
                  <p className={readonlyClass}>{profile.organization || t('notSet')}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  <Phone className="mr-1 inline h-3.5 w-3.5" />
                  {t('phoneNumber')}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={fieldClass}
                    placeholder={t('placeholderPhone')}
                  />
                ) : (
                  <p className={readonlyClass}>{profile.phone || t('notSet')}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t('saving')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {t('saveChanges')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        full_name: profile.full_name || '',
                        organization: profile.organization || '',
                        phone: profile.phone || '',
                      })
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    {c('cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Settings */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">{t('security')}</h2>
              <p className="text-xs text-gray-500">{t('securitySubtitle')}</p>
            </div>

            <div className="p-4">
              {!showPasswordForm ? (
                <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('password')}</h3>
                    <p className="text-xs text-gray-500">
                      {t('lastChanged')}{' '}
                      {profile.last_login
                        ? new Date(profile.last_login).toLocaleDateString()
                        : t('never')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Key className="h-4 w-4" />
                    {t('changePassword')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>{t('currentPassword')}</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className={`${fieldClass} pr-10`}
                        placeholder={t('placeholderCurrentPassword')}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            current: !showPasswords.current,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t('newPassword')}</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className={`${fieldClass} pr-10`}
                        placeholder={t('placeholderNewPassword')}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t('confirmPassword')}</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className={`${fieldClass} pr-10`}
                        placeholder={t('placeholderConfirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            confirm: !showPasswords.confirm,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
                    <button
                      onClick={handleChangePassword}
                      disabled={
                        changingPassword ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword
                      }
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {changingPassword ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          {t('changing')}
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4" />
                          {t('changePassword')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4" />
                      {c('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Organization Settings (VAT) */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{t('organizationSettings')}</h2>
                <p className="text-xs text-gray-500">{t('vatSubtitle')}</p>
              </div>
              {!isEditingVAT && (
                <button
                  onClick={() => setIsEditingVAT(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4" />
                  {c('edit')}
                </button>
              )}
            </div>

            <div className="space-y-4 p-4">
              <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5">
                <p className="text-sm text-blue-900">
                  <strong>{t('vatTipLabel')}</strong> {t('vatTip')}
                </p>
              </div>

              <div>
                <label className={labelClass}>{t('defaultVatPercentage')}</label>
                {isEditingVAT ? (
                  <>
                    <input
                      type="number"
                      value={vatData.default_vat_percentage}
                      onChange={(e) =>
                        setVatData({ ...vatData, default_vat_percentage: e.target.value })
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder={t('vatPercentagePlaceholder')}
                      className={fieldClass}
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('vatLeaveEmpty')}</p>
                  </>
                ) : (
                  <p className={readonlyClass}>
                    {profile.default_vat_percentage
                      ? `${profile.default_vat_percentage}%`
                      : t('notSet')}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t('vatLabelOptional')}</label>
                {isEditingVAT ? (
                  <>
                    <input
                      type="text"
                      value={vatData.vat_label}
                      onChange={(e) => setVatData({ ...vatData, vat_label: e.target.value })}
                      placeholder={t('vatPlaceholder')}
                      className={fieldClass}
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('vatFriendlyName')}</p>
                  </>
                ) : (
                  <p className={readonlyClass}>{profile.vat_label || t('notSet')}</p>
                )}
              </div>

              {isEditingVAT && (
                <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
                  <button
                    onClick={handleSaveVAT}
                    disabled={savingVAT}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingVAT ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t('saving')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {t('saveVatSettings')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingVAT(false)
                      setVatData({
                        default_vat_percentage:
                          profile.default_vat_percentage?.toString() || '',
                        vat_label: profile.vat_label || '',
                      })
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    {c('cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bank Account Settings — conference registration fees only */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{t('bankSettingsTitle')}</h2>
                <p className="text-xs text-gray-500">{t('bankSettingsSubtitle')}</p>
              </div>
              {!isEditingBank && (
                <button
                  onClick={() => setIsEditingBank(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4" />
                  {c('edit')}
                </button>
              )}
            </div>

            <div className="space-y-4 p-4">
              <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2.5">
                <p className="text-sm text-amber-900">
                  <strong>{t('bankInfoLabel')}</strong> {t('bankInfo')}
                </p>
              </div>

              <div>
                <label className={labelClass}>{t('bankAccountNumber')}</label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankData.bank_account_number}
                    onChange={(e) =>
                      setBankData({ ...bankData, bank_account_number: e.target.value })
                    }
                    className={`${fieldClass} font-mono`}
                    placeholder={t('bankPlaceholderIban')}
                    maxLength={34}
                  />
                ) : (
                  <p className={`${readonlyClass} font-mono`}>
                    {profile.bank_account_number || t('notSet')}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t('accountHolderName')}</label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankData.bank_account_holder}
                    onChange={(e) =>
                      setBankData({ ...bankData, bank_account_holder: e.target.value })
                    }
                    className={fieldClass}
                    placeholder={t('bankPlaceholderHolder')}
                  />
                ) : (
                  <p className={readonlyClass}>
                    {profile.bank_account_holder || t('notSet')}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t('bankName')}</label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankData.bank_name}
                    onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                    className={fieldClass}
                    placeholder={t('bankPlaceholderName')}
                  />
                ) : (
                  <p className={readonlyClass}>{profile.bank_name || t('notSet')}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t('swiftBic')}</label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankData.swift_bic}
                    onChange={(e) =>
                      setBankData({
                        ...bankData,
                        swift_bic: e.target.value.toUpperCase(),
                      })
                    }
                    className={`${fieldClass} font-mono`}
                    placeholder={t('bankPlaceholderSwift')}
                    maxLength={11}
                  />
                ) : (
                  <p className={`${readonlyClass} font-mono`}>
                    {profile.swift_bic || t('notSet')}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t('bankAddressOptional')}</label>
                {isEditingBank ? (
                  <textarea
                    value={bankData.bank_address}
                    onChange={(e) => setBankData({ ...bankData, bank_address: e.target.value })}
                    className={fieldClass}
                    placeholder={t('bankPlaceholderAddress')}
                    rows={2}
                  />
                ) : (
                  <p className={readonlyClass}>{profile.bank_address || t('notSet')}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t('accountCurrency')}</label>
                {isEditingBank ? (
                  <select
                    value={bankData.bank_account_currency}
                    onChange={(e) =>
                      setBankData({ ...bankData, bank_account_currency: e.target.value })
                    }
                    className={fieldClass}
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF</option>
                    <option value="HRK">HRK (kn)</option>
                  </select>
                ) : (
                  <p className={readonlyClass}>{profile.bank_account_currency || 'EUR'}</p>
                )}
              </div>

              {isEditingBank && (
                <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
                  <button
                    onClick={handleSaveBank}
                    disabled={savingBank}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingBank ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t('saving')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {t('saveBankSettings')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingBank(false)
                      setBankData({
                        bank_account_number: profile.bank_account_number || '',
                        bank_account_holder: profile.bank_account_holder || '',
                        bank_name: profile.bank_name || '',
                        swift_bic: profile.swift_bic || '',
                        bank_address: profile.bank_address || '',
                        bank_account_currency: profile.bank_account_currency || 'EUR',
                      })
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    {c('cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">{t('myConferences')}</h2>
              <p className="text-xs text-gray-500">
                {t('conferencesCount', { count: conferences.length })}
              </p>
            </div>
            <div className="p-4">
              {conferences.length === 0 ? (
                <p className="py-2 text-sm text-gray-500">{t('noConferencesAssigned')}</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conferences.slice(0, 5).map((conference) => (
                    <Link
                      key={conference.id}
                      href={`/admin/conferences/${conference.id}/settings`}
                      className="block py-2.5 transition-colors hover:bg-gray-50/80"
                    >
                      <p className="text-sm font-medium text-gray-900">{conference.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {conference.start_date
                          ? new Date(conference.start_date).toLocaleDateString()
                          : t('noDateSet')}
                      </p>
                    </Link>
                  ))}
                  {conferences.length > 5 && (
                    <Link
                      href="/admin/conferences"
                      className="block py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {t('viewAllConferences', { count: conferences.length })}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">{t('accountInfo')}</h2>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div>
                <label className={labelClass}>{t('roleLabel')}</label>
                <p className="font-medium text-gray-900">{roleLabel}</p>
              </div>
              <div>
                <label className={labelClass}>{t('memberSince')}</label>
                <p className="text-gray-900">
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : t('unknown')}
                </p>
              </div>
              {profile.last_login && (
                <div>
                  <label className={labelClass}>{t('lastLogin')}</label>
                  <p className="text-gray-900">
                    {new Date(profile.last_login).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

