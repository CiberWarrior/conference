/**
 * Pricing Utility Functions
 * Handles dynamic pricing calculation based on dates and tiers
 */

import type { ConferencePricing } from '@/types/conference'

export type PricingTier = 'early_bird' | 'regular' | 'late'

export interface CurrentPricing {
  tier: PricingTier
  participantPrice: number
  studentPrice: number
  accompanyingPersonPrice: number
  currency: string
  deadline?: string
  nextTier?: PricingTier
  nextTierDate?: string
}

/**
 * Determine which pricing tier is currently active based on dates
 * @param pricing - Conference pricing configuration
 * @param currentDate - Current date (defaults to now)
 * @param conferenceStartDate - Optional conference start date for late registration logic
 */
export function getCurrentPricingTier(
  pricing: ConferencePricing,
  currentDate: Date = new Date(),
  conferenceStartDate?: Date
): PricingTier {
  const earlyBirdDeadline = pricing.early_bird?.deadline
    ? new Date(pricing.early_bird.deadline)
    : null

  // If early bird deadline exists and hasn't passed, use early bird
  if (earlyBirdDeadline && currentDate <= earlyBirdDeadline) {
    return 'early_bird'
  }

  // If conference start date exists and we're within 14 days of it, use late registration
  if (conferenceStartDate) {
    const daysUntilConference = Math.ceil(
      (conferenceStartDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    // If conference starts within 14 days, apply late registration pricing
    if (daysUntilConference <= 14 && daysUntilConference >= 0) {
      return 'late'
    }
  }

  // Default to regular pricing if early bird passed and not in late registration period
  return 'regular'
}

/**
 * Get the current applicable pricing for a registration
 */
export function getCurrentPricing(
  pricing: ConferencePricing,
  currentDate: Date = new Date(),
  conferenceStartDate?: Date
): CurrentPricing {
  const tier = getCurrentPricingTier(pricing, currentDate, conferenceStartDate)
  const currency = pricing.currency || 'EUR'

  let participantPrice = 0
  let accompanyingPersonPrice = 0
  let deadline: string | undefined
  let nextTier: PricingTier | undefined
  let nextTierDate: string | undefined

  switch (tier) {
    case 'early_bird':
      participantPrice = pricing.early_bird?.amount || 0
      accompanyingPersonPrice = pricing.accompanying_person_price || 0
      deadline = pricing.early_bird?.deadline
      nextTier = 'regular'
      break
    case 'regular':
      participantPrice = pricing.regular?.amount || 0
      // Use early bird accompanying person price as fallback, or add regular/late specific prices later
      accompanyingPersonPrice = pricing.accompanying_person_price || 0
      break
    case 'late':
      participantPrice = pricing.late?.amount || 0
      accompanyingPersonPrice = pricing.accompanying_person_price || 0
      break
  }

  // Calculate student price (discount applies to all tiers)
  const studentPrice =
    participantPrice > 0 && pricing.student_discount
      ? Math.max(0, participantPrice - pricing.student_discount)
      : 0

  return {
    tier,
    participantPrice,
    studentPrice,
    accompanyingPersonPrice,
    currency,
    deadline,
    nextTier,
    nextTierDate,
  }
}

/**
 * Format price with currency
 */
export function formatPrice(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: PricingTier): string {
  switch (tier) {
    case 'early_bird':
      return 'Early Bird'
    case 'regular':
      return 'Regular'
    case 'late':
      return 'Late Registration'
    default:
      return 'Standard'
  }
}

