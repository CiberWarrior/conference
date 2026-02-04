'use client'

import type { ConferenceFormData, OnFormDataChange } from './types'
import type { PaymentSettings } from '@/types/conference'

interface PaymentSettingsSectionProps {
  formData: ConferenceFormData
  onChange: OnFormDataChange
  paymentSettings?: PaymentSettings
  onPaymentSettingsChange?: (settings: PaymentSettings) => void
}

export default function PaymentSettingsSection({
  formData,
  onChange,
}: PaymentSettingsSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <p className="text-sm text-gray-500">
        Payment options are configured inline in settings page.
      </p>
    </div>
  )
}
