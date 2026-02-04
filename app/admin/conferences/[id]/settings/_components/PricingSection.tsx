/**
 * Pricing Section - Currency, VAT, participant pricing tiers, student pricing
 */

import { useTranslations } from 'next-intl'
import type { OnFormDataChange, ConferenceFormData } from './types'
import { formatPriceWithoutZeros } from '@/utils/pricing'

interface PricingSectionProps {
  formData: ConferenceFormData
  useDefaultVAT: boolean
  onUseDefaultVATChange: (value: boolean) => void
  onChange: OnFormDataChange
  defaultVAT?: number
}

export default function PricingSection({
  formData,
  useDefaultVAT,
  onUseDefaultVATChange,
  onChange,
  defaultVAT,
}: PricingSectionProps) {
  const t = useTranslations('admin.conferences')

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">{t('pricing')}</h2>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('currency')}
        </label>
        <select
          value={formData.currency}
          onChange={(e) => onChange({ currency: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="EUR">EUR (€)</option>
          <option value="USD">USD ($)</option>
          <option value="GBP">GBP (£)</option>
          <option value="HRK">HRK (kn)</option>
        </select>
      </div>

      {/* VAT Settings */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900">{t('vatSettings')}</h3>

        {/* Use Default VAT Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="useDefaultVAT"
            checked={useDefaultVAT}
            onChange={(e) => onUseDefaultVATChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="useDefaultVAT" className="text-sm text-gray-700">
            {t('useOrganizationDefaultVAT')} {defaultVAT ? `(${defaultVAT}%)` : ''}
          </label>
        </div>

        {/* Custom VAT Input */}
        {!useDefaultVAT && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('vatPercentage')}
            </label>
            <input
              type="number"
              value={formData.vat_percentage}
              onChange={(e) => onChange({ vat_percentage: e.target.value })}
              min="0"
              max="100"
              step="0.01"
              placeholder="25"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">{t('vatPercentageHelp')}</p>
          </div>
        )}

        {/* Prices Include VAT */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pricesIncludeVat"
            checked={formData.prices_include_vat}
            onChange={(e) => onChange({ prices_include_vat: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="pricesIncludeVat" className="text-sm text-gray-700">
            {t('pricesIncludeVAT')}
          </label>
        </div>
        <p className="text-xs text-gray-500">{t('pricesIncludeVATHelp')}</p>
      </div>

      {/* Participant Pricing - Early Bird */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('participantPricing')}</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Early Bird */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900">{t('earlyBird')}</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('amount')} ({formData.currency})
              </label>
              <input
                type="number"
                value={formData.early_bird_amount}
                onChange={(e) => onChange({ early_bird_amount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('validFrom')}
              </label>
              <input
                type="date"
                value={formData.early_bird_start_date}
                onChange={(e) => onChange({ early_bird_start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('deadline')} *
              </label>
              <input
                type="date"
                value={formData.early_bird_deadline}
                onChange={(e) => onChange({ early_bird_deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Regular */}
          <div className="space-y-3 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900">{t('regular')}</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('amount')} ({formData.currency})
              </label>
              <input
                type="number"
                value={formData.regular_amount}
                onChange={(e) => onChange({ regular_amount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('validFrom')}
              </label>
              <input
                type="date"
                value={formData.regular_start_date}
                onChange={(e) => onChange({ regular_start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('validTo')}
              </label>
              <input
                type="date"
                value={formData.regular_end_date}
                onChange={(e) => onChange({ regular_end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Late Registration */}
        <div className="p-4 bg-orange-50 rounded-lg space-y-3">
          <h4 className="font-semibold text-orange-900">{t('lateRegistration')}</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('amount')} ({formData.currency})
              </label>
              <input
                type="number"
                value={formData.late_amount}
                onChange={(e) => onChange({ late_amount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('validFrom')}
              </label>
              <input
                type="date"
                value={formData.late_start_date}
                onChange={(e) => onChange({ late_start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('validTo')}
              </label>
              <input
                type="date"
                value={formData.late_end_date}
                onChange={(e) => onChange({ late_end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Student Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('studentPricing')}</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('studentEarlyBird')} ({formData.currency})
            </label>
            <input
              type="number"
              value={formData.student_early_bird}
              onChange={(e) => onChange({ student_early_bird: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('studentRegular')} ({formData.currency})
            </label>
            <input
              type="number"
              value={formData.student_regular}
              onChange={(e) => onChange({ student_regular: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('studentLate')} ({formData.currency})
            </label>
            <input
              type="number"
              value={formData.student_late}
              onChange={(e) => onChange({ student_late: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Accompanying Person Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('accompanyingPersonPrice')} ({formData.currency})
        </label>
        <input
          type="number"
          value={formData.accompanying_person_price}
          onChange={(e) => onChange({ accompanying_person_price: parseFloat(e.target.value) || 0 })}
          min="0"
          step="0.01"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">{t('accompanyingPersonPriceHelp')}</p>
      </div>
    </section>
  )
}
