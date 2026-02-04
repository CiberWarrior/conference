import type { PaymentSettings } from '@/types/conference'

/**
 * Default payment settings for new conferences.
 * Single source of truth: aligned with docs (PAYMENT_OPTIONS_GUIDE, PAYMENT_SETTINGS_IMPLEMENTATION).
 * Industry standard: Pay Later as default (IEEE, ACM, ISMB).
 */
export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  enabled: true,
  allow_card: true,
  allow_bank_transfer: true,
  allow_pay_later: true,
  default_preference: 'pay_later',
  required_at_registration: false,
  bank_transfer_deadline_days: 7, // Days user has to complete bank transfer after registering
  payment_deadline_days: 30, // Days before conference start – payment due date for "pay later"
}
