'use client'

import { useTranslations } from 'next-intl'
import { CreditCard, Building2, User, Upload } from 'lucide-react'
import type { PaymentSettings as PaymentSettingsType } from '@/types/conference'

interface PaymentSectionProps {
  paymentSettings?: PaymentSettingsType | null
  availablePaymentOptions: { card: boolean; bank: boolean; later: boolean }
  availableOptionsCount: number
  paymentPreference: 'pay_now_card' | 'pay_now_bank' | ''
  onPaymentPreferenceChange: (v: 'pay_now_card' | 'pay_now_bank') => void
  payerType: 'person' | 'company' | ''
  onPayerTypeChange: (v: 'person' | 'company') => void
  companyVatNumber: string
  onCompanyVatNumberChange: (v: string) => void
  companyNoVat: boolean
  onCompanyNoVatChange: (v: boolean) => void
  companyName: string
  onCompanyNameChange: (v: string) => void
  companyCountry: string
  onCompanyCountryChange: (v: string) => void
  companyCity: string
  onCompanyCityChange: (v: string) => void
  companyPostalCode: string
  onCompanyPostalCodeChange: (v: string) => void
  companyAddress: string
  onCompanyAddressChange: (v: string) => void
  companyPhone: string
  onCompanyPhoneChange: (v: string) => void
  bankTransferProofFile: File | null
  onBankTransferProofFileChange: (v: File | null) => void
}

export default function PaymentSection({
  availablePaymentOptions,
  availableOptionsCount,
  paymentPreference,
  onPaymentPreferenceChange,
  payerType,
  onPayerTypeChange,
  companyVatNumber,
  onCompanyVatNumberChange,
  companyNoVat,
  onCompanyNoVatChange,
  companyName,
  onCompanyNameChange,
  companyCountry,
  onCompanyCountryChange,
  companyCity,
  onCompanyCityChange,
  companyPostalCode,
  onCompanyPostalCodeChange,
  companyAddress,
  onCompanyAddressChange,
  companyPhone,
  onCompanyPhoneChange,
  bankTransferProofFile,
  onBankTransferProofFileChange,
}: PaymentSectionProps) {
  const t = useTranslations('registrationForm')

  return (
    <div className="pt-6 border-t-2 border-gray-100 space-y-8">
      {/* Payment Method Selection - Card Style */}
      {availableOptionsCount > 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{t('choosePaymentMethod')}</h3>
            {!paymentPreference && (
              <span className="text-sm font-medium text-red-600">*</span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {availablePaymentOptions.card && (
              <button
                type="button"
                onClick={() => onPaymentPreferenceChange('pay_now_card')}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  paymentPreference === 'pay_now_card'
                    ? 'border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                    : paymentPreference === ''
                    ? 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                    : 'border-gray-200 bg-gray-50 opacity-60 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      paymentPreference === 'pay_now_card'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{t('payByCard')}</h4>
                    <p className="text-sm text-gray-600">{t('payByCardDescription')}</p>
                  </div>
                  {paymentPreference === 'pay_now_card' && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            )}

            {availablePaymentOptions.bank && (
              <button
                type="button"
                onClick={() => onPaymentPreferenceChange('pay_now_bank')}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  paymentPreference === 'pay_now_bank'
                    ? 'border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                    : paymentPreference === ''
                    ? 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                    : 'border-gray-200 bg-gray-50 opacity-60 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      paymentPreference === 'pay_now_bank'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{t('bankTransfer')}</h4>
                    <p className="text-sm text-gray-600">{t('bankTransferDescription')}</p>
                  </div>
                  {paymentPreference === 'pay_now_bank' && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payer Type Selection - Card Style */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{t('whoIsPaying')}</h3>
          {!payerType && (
            <span className="text-sm font-medium text-red-600">*</span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPayerTypeChange('person')}
            className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
              payerType === 'person'
                ? 'border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                : payerType === ''
                ? 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                : 'border-gray-200 bg-gray-50 opacity-60 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  payerType === 'person' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{t('privatePerson')}</h4>
                <p className="text-sm text-gray-600">{t('privatePersonDescription')}</p>
              </div>
              {payerType === 'person' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onPayerTypeChange('company')}
            className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
              payerType === 'company'
                ? 'border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                : payerType === ''
                ? 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                : 'border-gray-200 bg-gray-50 opacity-60 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  payerType === 'company' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{t('company')}</h4>
                <p className="text-sm text-gray-600">{t('companyDescription')}</p>
              </div>
              {payerType === 'company' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Company Details Form */}
      {payerType === 'company' && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-6 border border-gray-200">
          <h4 className="text-base font-semibold text-gray-900">{t('companyDetails')}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
                placeholder={t('companyNamePlaceholder') || 'Company Name Ltd.'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyCountry')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyCountry}
                onChange={(e) => onCompanyCountryChange(e.target.value)}
                placeholder={t('companyCountryPlaceholder') || 'Croatia'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyCity')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyCity}
                onChange={(e) => onCompanyCityChange(e.target.value)}
                placeholder={t('companyCityPlaceholder') || 'Zagreb'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyPostalCode')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyPostalCode}
                onChange={(e) => onCompanyPostalCodeChange(e.target.value)}
                placeholder={t('companyPostalCodePlaceholder') || '10000'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyPhone')}
              </label>
              <input
                type="tel"
                value={companyPhone}
                onChange={(e) => onCompanyPhoneChange(e.target.value)}
                placeholder={t('companyPhonePlaceholder') || '+385 1 234 5678'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyAddress')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => onCompanyAddressChange(e.target.value)}
                placeholder={t('companyAddressPlaceholder') || 'Street Name 123'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={companyNoVat}
                  onChange={(e) => onCompanyNoVatChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{t('companyNoVat')}</span>
              </label>

              {!companyNoVat && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('companyVat')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyVatNumber}
                    onChange={(e) => onCompanyVatNumberChange(e.target.value)}
                    placeholder={t('companyVatPlaceholder') || 'HR12345678901'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required={!companyNoVat}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Proof Upload - Shown for both person and company if bank transfer is selected */}
      {paymentPreference === 'pay_now_bank' && (
        <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">{t('bankTransferProof')}</h4>
              <p className="text-sm text-gray-600">{t('bankTransferProofDescription')}</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => onBankTransferProofFileChange(e.target.files?.[0] ?? null)}
              className="w-full px-4 py-3 border-2 border-dashed border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700"
            />
            {bankTransferProofFile && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200 flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-gray-900">{bankTransferProofFile.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
