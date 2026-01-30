'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { useConference } from '@/contexts/ConferenceContext'
import { supabase } from '@/lib/supabase'
import { showSuccess, showError } from '@/utils/toast'
import {
  User,
  Mail,
  Building2,
  Phone,
  Calendar,
  Shield,
  Key,
  Save,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Receipt,
  CreditCard,
} from 'lucide-react'
import Link from 'next/link'

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
      showSuccess('Bank account settings updated successfully!')
    } catch (error) {
      console.error('Error updating bank settings:', error)
      showError('Failed to update bank account settings')
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
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <p className="text-gray-600 mt-2">Manage your profile and security settings</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('profileInformation')}</h2>
                    <p className="text-sm text-gray-600">{t('yourPersonalDetails')}</p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {c('edit')}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">{t('emailCannotBeChanged')}</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('fullName')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder={t('yourFullName')}
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                    {profile.full_name || t('notSet')}
                  </p>
                )}
              </div>

              {/* Organization */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  {t('organization')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder={t('yourOrganization')}
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                    {profile.organization || t('notSet')}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  {t('phoneNumber')}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="+385 1 234 5678"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                    {profile.phone || t('notSet')}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('accountStatus')}
                </label>
                <div className="flex items-center gap-2">
                  {profile.active ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">{t('active')}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-700 font-medium">{t('inactive')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t('saving')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
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
                    className="flex items-center gap-2 px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    {c('cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Security</h2>
                  <p className="text-sm text-gray-600">Manage your password and security</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {!showPasswordForm ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Password</h3>
                      <p className="text-sm text-gray-600">Last changed: {profile.last_login ? new Date(profile.last_login).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      Change Password
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12"
                        placeholder="Enter new password (min. 8 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {changingPassword ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Changing...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          Change Password
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
                      className="flex items-center gap-2 px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {c('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Organization Settings (VAT) */}
          <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Organization Settings</h2>
                    <p className="text-sm text-gray-600">Default VAT/PDV for all conferences</p>
                  </div>
                </div>
                {!isEditingVAT && (
                  <button
                    onClick={() => setIsEditingVAT(true)}
                    className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Set a default VAT percentage here (e.g., 25% for Croatia). 
                  All new conferences will automatically use this setting, but you can override it 
                  for individual conferences if needed.
                </p>
              </div>

              {/* VAT Percentage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Default VAT Percentage (%)
                </label>
                {isEditingVAT ? (
                  <>
                    <input
                      type="number"
                      value={vatData.default_vat_percentage}
                      onChange={(e) => setVatData({ ...vatData, default_vat_percentage: e.target.value })}
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="e.g. 25 for 25%"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty if you don't want to set a default VAT
                    </p>
                  </>
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                    {profile.default_vat_percentage 
                      ? `${profile.default_vat_percentage}%` 
                      : 'Not set'}
                  </p>
                )}
              </div>

              {/* VAT Label */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  VAT Label (Optional)
                </label>
                {isEditingVAT ? (
                  <>
                    <input
                      type="text"
                      value={vatData.vat_label}
                      onChange={(e) => setVatData({ ...vatData, vat_label: e.target.value })}
                      placeholder="e.g., Croatia PDV, Germany MwSt"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Friendly name for display (e.g., "Croatia PDV")
                    </p>
                  </>
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                    {profile.vat_label || 'Not set'}
                  </p>
                )}
              </div>

              {/* Edit Actions */}
              {isEditingVAT && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveVAT}
                    disabled={savingVAT}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {savingVAT ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save VAT Settings
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingVAT(false)
                      setVatData({
                        default_vat_percentage: profile.default_vat_percentage?.toString() || '',
                        vat_label: profile.vat_label || '',
                      })
                    }}
                    className="flex items-center gap-2 px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    {c('cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bank Account Settings */}
          <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Bank Account Settings</h2>
                    <p className="text-sm text-gray-600">For receiving bank transfer payments</p>
                  </div>
                </div>
                {!isEditingBank && (
                  <button
                    onClick={() => setIsEditingBank(true)}
                    className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-900">
                  <strong>Info:</strong> Add your bank account details here. This information will be shown 
                  to participants who choose to pay by bank transfer. Leave empty if you don't accept bank transfers yet.
                </p>
              </div>

              {/* Bank Account Number (IBAN) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Account Number (IBAN)
                </label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankData.bank_account_number}
                    onChange={(e) => setBankData({ ...bankData, bank_account_number: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 font-mono"
                    placeholder="HR1234567890123456789"
                    maxLength={34}
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-mono">
                    {profile.bank_account_number || 'Not set'}
                  </p>
                )}
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Holder Name
                </label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankData.bank_account_holder}
                    onChange={(e) => setBankData({ ...bankData, bank_account_holder: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    placeholder="Organization Name"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                    {profile.bank_account_holder || 'Not set'}
                  </p>
                )}
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Name
                </label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankData.bank_name}
                    onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    placeholder="e.g., Erste Bank, Zagrebačka banka"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                    {profile.bank_name || 'Not set'}
                  </p>
                )}
              </div>

              {/* SWIFT/BIC Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SWIFT/BIC Code (for international transfers)
                </label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankData.swift_bic}
                    onChange={(e) => setBankData({ ...bankData, swift_bic: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 font-mono"
                    placeholder="ZABAHR2X"
                    maxLength={11}
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-mono">
                    {profile.swift_bic || 'Not set'}
                  </p>
                )}
              </div>

              {/* Bank Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Address (optional)
                </label>
                {isEditingBank ? (
                  <textarea
                    value={bankData.bank_address}
                    onChange={(e) => setBankData({ ...bankData, bank_address: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    placeholder="Full bank address for international transfers"
                    rows={2}
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                    {profile.bank_address || 'Not set'}
                  </p>
                )}
              </div>

              {/* Account Currency */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Currency
                </label>
                {isEditingBank ? (
                  <select
                    value={bankData.bank_account_currency}
                    onChange={(e) => setBankData({ ...bankData, bank_account_currency: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF</option>
                    <option value="HRK">HRK (kn)</option>
                  </select>
                ) : (
                  <p className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                    {profile.bank_account_currency || 'EUR'}
                  </p>
                )}
              </div>

              {/* Edit Actions */}
              {isEditingBank && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveBank}
                    disabled={savingBank}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {savingBank ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
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
                    className="flex items-center gap-2 px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    {c('cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Conferences */}
        <div className="space-y-6">
          {/* My Conferences */}
          <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">My Conferences</h2>
                  <p className="text-sm text-gray-600">{conferences.length} conference(s)</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {conferences.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">No conferences assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conferences.slice(0, 5).map((conference) => (
                    <Link
                      key={conference.id}
                      href={`/admin/conferences/${conference.id}/settings`}
                      className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <p className="font-semibold text-gray-900">{conference.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {conference.start_date ? new Date(conference.start_date).toLocaleDateString() : 'No date set'}
                      </p>
                    </Link>
                  ))}
                  {conferences.length > 5 && (
                    <Link
                      href="/admin/conferences"
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
                    >
                      View all {conferences.length} conferences →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Account Info</h2>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label>
                <p className="text-gray-900 font-medium">
                  {profile.role === 'super_admin' ? 'Super Admin' : 'Conference Admin'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Member Since</label>
                <p className="text-gray-900">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              {profile.last_login && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Last Login</label>
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

