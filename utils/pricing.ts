/**
 * Pricing Utility Functions
 * Handles dynamic pricing calculation based on dates and tiers
 */

import type { ConferencePricing, StandardFeeTypeKey } from '@/types/conference'

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
      participantPrice = getPriceAmount(pricing.early_bird?.amount, currency)
      accompanyingPersonPrice = getPriceAmount(pricing.accompanying_person_price, currency)
      deadline = pricing.early_bird?.deadline
      nextTier = 'regular'
      break
    case 'regular':
      participantPrice = getPriceAmount(pricing.regular?.amount, currency)
      // Use early bird accompanying person price as fallback, or add regular/late specific prices later
      accompanyingPersonPrice = getPriceAmount(pricing.accompanying_person_price, currency)
      break
    case 'late':
      participantPrice = getPriceAmount(pricing.late?.amount, currency)
      accompanyingPersonPrice = getPriceAmount(pricing.accompanying_person_price, currency)
      break
  }

  // Calculate student price (discount applies to all tiers)
  const studentDiscount = getPriceAmount(pricing.student_discount, currency)
  const studentPrice =
    participantPrice > 0 && studentDiscount > 0
      ? Math.max(0, participantPrice - studentDiscount)
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
 * Format price without trailing zeros (450.00 -> 450, 450.50 -> 450.5, 450.55 -> 450.55)
 */
export function formatPriceWithoutZeros(amount: number): string {
  // Convert to string with 2 decimals, then remove trailing zeros
  const formatted = amount.toFixed(2)
  return formatted.replace(/\.?0+$/, '')
}

/**
 * Format price with currency
 */
export function formatPrice(amount: number, currency: string): string {
  return `${formatPriceWithoutZeros(amount)} ${currency}`
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'CHF',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    HRK: 'kn',
  }
  return symbols[currencyCode.toUpperCase()] || currencyCode
}

/**
 * Format price with currency symbol for better UX
 */
export function formatPriceWithSymbol(
  amount: number,
  currency: string = 'EUR'
): string {
  const symbol = getCurrencySymbol(currency)
  const formattedAmount = formatPriceWithoutZeros(amount)
  // For currencies with prefix symbols (USD, GBP, CAD, AUD)
  if (['$', '£', 'CA$', 'A$'].includes(symbol)) {
    return `${symbol}${formattedAmount}`
  }
  // For currencies with suffix symbols (EUR, CHF, HRK, JPY, CNY)
  return `${formattedAmount} ${symbol}`
}

/**
 * Get price amount from pricing object (supports both single value and multi-currency)
 */
export function getPriceAmount(
  priceField: number | Record<string, number> | undefined,
  currency: string = 'EUR'
): number {
  if (!priceField) return 0

  // If it's a single number, return it
  if (typeof priceField === 'number') {
    return priceField
  }

  // If it's a multi-currency object, return the price for selected currency
  if (typeof priceField === 'object' && currency in priceField) {
    return priceField[currency]
  }

  // Fallback: return first available currency value or 0
  const values = Object.values(priceField)
  return values.length > 0 ? values[0] : 0
}

const DEFAULT_TIER_LABELS: Record<PricingTier, string> = {
  early_bird: 'Early Bird',
  regular: 'Regular',
  late: 'Late Registration',
}

/**
 * Get tier display name. Ako su prosleđeni fee_type_labels, koristi prikazni naziv po konferenciji.
 */
export function getTierDisplayName(
  tier: PricingTier | StandardFeeTypeKey,
  feeTypeLabels?: Partial<Record<StandardFeeTypeKey, string>>
): string {
  if (feeTypeLabels && tier in feeTypeLabels && feeTypeLabels[tier as StandardFeeTypeKey]) {
    return feeTypeLabels[tier as StandardFeeTypeKey]!
  }
  switch (tier) {
    case 'early_bird':
      return DEFAULT_TIER_LABELS.early_bird
    case 'regular':
      return DEFAULT_TIER_LABELS.regular
    case 'late':
      return DEFAULT_TIER_LABELS.late
    case 'student':
      return 'Student'
    case 'accompanying_person':
      return 'Accompanying Person'
    default:
      return 'Standard'
  }
}

/**
 * Calculate price with VAT (PDV) from base price
 * @param basePrice - Cijena bez PDV-a
 * @param vatPercentage - PDV postotak (npr. 25 za 25%)
 * @returns Cijena sa PDV-om
 */
export function calculatePriceWithVAT(basePrice: number, vatPercentage: number): number {
  return basePrice * (1 + vatPercentage / 100)
}

/**
 * Calculate base price (without VAT) from price with VAT
 * @param priceWithVAT - Cijena sa PDV-om
 * @param vatPercentage - PDV postotak (npr. 25 za 25%)
 * @returns Cijena bez PDV-a
 */
export function calculatePriceWithoutVAT(priceWithVAT: number, vatPercentage: number): number {
  return priceWithVAT / (1 + vatPercentage / 100)
}

/**
 * Calculate VAT amount from base price
 * @param basePrice - Cijena bez PDV-a
 * @param vatPercentage - PDV postotak (npr. 25 za 25%)
 * @returns Iznos PDV-a
 */
export function calculateVATAmount(basePrice: number, vatPercentage: number): number {
  return basePrice * (vatPercentage / 100)
}

/**
 * Format price with VAT information (shows both with and without VAT)
 * @param basePrice - Cijena bez PDV-a
 * @param currency - Valuta
 * @param vatPercentage - PDV postotak (opcionalno)
 * @returns Formatirani string sa cijenom sa i bez PDV-a
 */
export function formatPriceWithVAT(
  basePrice: number,
  currency: string,
  vatPercentage?: number
): string {
  if (!vatPercentage || vatPercentage === 0) {
    return formatPrice(basePrice, currency)
  }

  const priceWithVAT = calculatePriceWithVAT(basePrice, vatPercentage)
  return `${formatPrice(basePrice, currency)} (bez PDV-a) / ${formatPrice(priceWithVAT, currency)} (sa PDV-om ${vatPercentage}%)`
}

/**
 * Get effective VAT percentage (conference override > user default > null)
 * @param conferenceVAT - Conference-specific VAT (can be null/undefined)
 * @param userDefaultVAT - User/organization default VAT (can be null/undefined)
 * @returns Effective VAT percentage to use
 */
export function getEffectiveVAT(
  conferenceVAT?: number | null,
  userDefaultVAT?: number | null
): number | null {
  // Priority: Conference override > User default > null
  if (conferenceVAT !== null && conferenceVAT !== undefined) {
    return conferenceVAT
  }
  if (userDefaultVAT !== null && userDefaultVAT !== undefined) {
    return userDefaultVAT
  }
  return null
}

/**
 * Get price breakdown with and without VAT
 * @param basePrice - Cijena bez PDV-a
 * @param vatPercentage - PDV postotak (opcionalno)
 * @returns Objekt sa cijenom bez PDV-a, sa PDV-om i iznosom PDV-a
 */
export function getPriceBreakdown(
  basePrice: number,
  vatPercentage?: number
): {
  withoutVAT: number
  withVAT: number
  vatAmount: number
  vatPercentage: number
} {
  if (!vatPercentage || vatPercentage === 0) {
    return {
      withoutVAT: basePrice,
      withVAT: basePrice,
      vatAmount: 0,
      vatPercentage: 0,
    }
  }

  const vatAmount = calculateVATAmount(basePrice, vatPercentage)
  const withVAT = basePrice + vatAmount

  return {
    withoutVAT: basePrice,
    withVAT,
    vatAmount,
    vatPercentage,
  }
}

/**
 * Get price breakdown when the input price can be either net (bez PDV-a) or gross (sa PDV-om).
 *
 * This is useful when admins can choose how they enter prices, while the UI still needs:
 * - a final price (sa PDV-om) for participants
 * - both net/gross breakdown for admin reporting
 *
 * @param inputPrice - Entered price (net or gross depending on pricesIncludeVAT)
 * @param vatPercentage - PDV postotak (opcionalno)
 * @param pricesIncludeVAT - If true, inputPrice is VAT-inclusive (sa PDV-om)
 */
export function getPriceBreakdownFromInput(
  inputPrice: number,
  vatPercentage?: number,
  pricesIncludeVAT: boolean = false
): {
  withoutVAT: number
  withVAT: number
  vatAmount: number
  vatPercentage: number
} {
  if (!vatPercentage || vatPercentage === 0) {
    return {
      withoutVAT: inputPrice,
      withVAT: inputPrice,
      vatAmount: 0,
      vatPercentage: 0,
    }
  }

  if (pricesIncludeVAT) {
    const withoutVAT = calculatePriceWithoutVAT(inputPrice, vatPercentage)
    const vatAmount = inputPrice - withoutVAT

    return {
      withoutVAT,
      withVAT: inputPrice,
      vatAmount,
      vatPercentage,
    }
  }

  // Default behavior: input is net (bez PDV-a)
  return getPriceBreakdown(inputPrice, vatPercentage)
}
