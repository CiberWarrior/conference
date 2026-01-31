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
  const regularStart = pricing.regular?.start_date
    ? new Date(pricing.regular.start_date)
    : null
  const regularEnd = pricing.regular?.end_date
    ? new Date(pricing.regular.end_date)
    : null
  const lateStart = pricing.late?.start_date
    ? new Date(pricing.late.start_date)
    : null

  // 1. Early Bird: do datuma isteka vrijedi Early Bird cijena
  if (earlyBirdDeadline && currentDate <= earlyBirdDeadline) {
    return 'early_bird'
  }

  // 2. Late: od late.start_date vrijedi Late cijena (ako je postavljen)
  if (lateStart && currentDate >= lateStart) {
    return 'late'
  }

  // 3. Regular: između early bird isteka i late početka (ili unutar regular.start–end ako su postavljeni)
  if (regularStart && currentDate >= regularStart) {
    if (!regularEnd || currentDate <= regularEnd) {
      return 'regular'
    }
    // regular period ended, no late start → still treat as regular unless we have late
    if (!lateStart) return 'regular'
  }
  // Fallback: ako nema explicit regular datuma, nakon early birda je regular do late/14 dana
  if (conferenceStartDate && !lateStart) {
    const daysUntilConference = Math.ceil(
      (conferenceStartDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilConference <= 14 && daysUntilConference >= 0) {
      return 'late'
    }
  }

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

/**
 * Posebni postupak PDV-a za putničke agencije (čl. 91.–94. ZPDV-a).
 * Prema literaturi (npr. Cutvarić 2019, mint.gov.hr): marža (bruto) = prodajna cijena (bruto)
 * − izravni troškovi (iznosi po ulaznim računima, s PDV-om ako ga pružatelj zaračunava).
 * „Ostvarena razlika predstavlja ukupnu naknadu u kojoj je sadržan i PDV“ → primjenjuje se
 * preračunata stopa 20% na maržu (bruto). PDV na plaćanje = marža_bruto × 20%.
 *
 * @param sellingPriceGross - Prodajna cijena s PDV-om (bruto) – ukupna naknada od kupca
 * @param costGross - Izravni troškovi (iznosi po ulaznim računima, bruto)
 */
export function getTravelAgencyMarginVat(
  sellingPriceGross: number,
  costGross: number
): {
  margin: number
  vatPayableRate: number
  vatPayableAmount: number
} {
  const margin = Math.max(0, sellingPriceGross - costGross)
  const TRAVEL_AGENCY_MARGIN_VAT_RATE = 20 // preračunata stopa (ZPDV)
  const vatPayableAmount = margin * (TRAVEL_AGENCY_MARGIN_VAT_RATE / 100)
  return {
    margin,
    vatPayableRate: TRAVEL_AGENCY_MARGIN_VAT_RATE,
    vatPayableAmount,
  }
}

/**
 * Server-side: compute the final amount to charge (gross) for a registration.
 * Used by register API (pay_now_card response) and create-payment-intent (when amount not sent).
 *
 * @param registration - { registration_fee_type: string | null }
 * @param conference - { pricing: ConferencePricing, start_date?: string }
 */
export function getRegistrationChargeAmount(
  registration: { registration_fee_type: string | null },
  conference: { pricing?: ConferencePricing | null; start_date?: string | null }
): { amount: number; currency: string } {
  const pricing = conference.pricing
  const currency = pricing?.currency || 'EUR'
  if (!pricing || !registration.registration_fee_type) {
    return { amount: 0, currency }
  }

  const feeType = registration.registration_fee_type
  const conferenceStartDate = conference.start_date
    ? new Date(conference.start_date)
    : undefined
  const tier = getCurrentPricingTier(
    pricing,
    new Date(),
    conferenceStartDate
  )

  let netAmount = 0
  if (feeType === 'early_bird') {
    netAmount = getPriceAmount(pricing.early_bird?.amount, currency)
  } else if (feeType === 'regular') {
    netAmount = getPriceAmount(pricing.regular?.amount, currency)
  } else if (feeType === 'late') {
    netAmount = getPriceAmount(pricing.late?.amount, currency)
  } else if (feeType === 'student') {
    const reg = getPriceAmount(pricing.regular?.amount, currency)
    const disc = getPriceAmount(pricing.student_discount, currency)
    netAmount = pricing.student?.regular ?? Math.max(0, reg - disc)
  } else if (feeType === 'accompanying_person') {
    netAmount = getPriceAmount(pricing.accompanying_person_price, currency)
  } else if (feeType.startsWith('fee_type_')) {
    const id = feeType.replace('fee_type_', '')
    const ft = pricing.custom_fee_types?.find((f) => f.id === id)
    if (ft) {
      if (ft.amount != null && ft.amount !== undefined) {
        netAmount = ft.amount
      } else {
        netAmount =
          tier === 'early_bird'
            ? ft.early_bird
            : tier === 'regular'
              ? ft.regular
              : ft.late
      }
    }
  } else if (feeType.startsWith('custom_')) {
    const fid = feeType.replace('custom_', '')
    const cf = pricing.custom_fields?.find((f) => f.id === fid)
    if (cf) netAmount = getPriceAmount(cf.value, currency)
  }

  const vatPercentage =
    pricing.vat_percentage != null && Number.isFinite(pricing.vat_percentage)
      ? Number(pricing.vat_percentage)
      : undefined
  const pricesIncludeVAT = !!pricing.prices_include_vat
  const { withVAT } = getPriceBreakdownFromInput(
    netAmount,
    vatPercentage,
    pricesIncludeVAT
  )

  return { amount: Math.round(withVAT * 100) / 100, currency }
}
