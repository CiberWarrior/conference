/**
 * Shared types for Conference Settings components
 */

import type {
  Conference,
  CustomRegistrationField,
  HotelOption,
  PaymentSettings,
} from '@/types/conference'
import type { ParticipantSettings } from '@/types/participant'

// Form data structure
export interface ConferenceFormData {
  name: string
  description: string
  start_date: string
  end_date: string
  location: string
  venue: string
  website_url: string
  logo_url?: string
  primary_color: string
  // Pricing (currency + VAT only; registration fees in custom_registration_fees table)
  currency: string
  vat_percentage: string | number
  prices_include_vat: boolean
  // Legacy tier-based pricing (optional; used by PricingSection if rendered)
  early_bird_amount?: number
  early_bird_start_date?: string
  early_bird_deadline?: string
  regular_amount?: number
  regular_start_date?: string
  regular_end_date?: string
  late_amount?: number
  late_start_date?: string
  late_end_date?: string
  student_early_bird?: number
  student_regular?: number
  student_late?: number
  accompanying_person_price?: number
  // Settings
  registration_enabled: boolean
  abstract_submission_enabled: boolean
  payment_required: boolean
  max_registrations: string
  timezone: string
  custom_registration_fields: CustomRegistrationField[]
  custom_abstract_fields: CustomRegistrationField[]
  // Email
  from_email: string
  from_name: string
  reply_to: string
  // Status
  published: boolean
  active: boolean
}

// Callback types
export type OnFormDataChange = (updates: Partial<ConferenceFormData>) => void
export type OnHotelOptionsChange = (hotels: HotelOption[]) => void
export type OnPaymentSettingsChange = (settings: PaymentSettings) => void
export type OnParticipantSettingsChange = (settings: ParticipantSettings) => void
