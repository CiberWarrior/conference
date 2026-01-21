import type { PaymentSettings } from '@/types/conference'

/**
 * Default payment settings for new conferences
 * Based on industry best practices (IEEE, ACM, ISMB)
 */
export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  enabled: true, // Payment enabled by default
  allow_card: true, // Allow credit/debit card (Stripe)
  allow_bank_transfer: true, // Allow bank transfer
  allow_pay_later: false, // Pay Later disabled (product decision)
  default_preference: 'pay_now_card', // Default to immediate payment
  required_at_registration: false, // Payment preference is optional (not forced)
  bank_transfer_deadline_days: 7, // 7 days to complete bank transfer
  payment_deadline_days: 30, // 30 days before conference for "pay later"
}
