/**
 * Unit tests for utils/pricing.ts
 */

import {
  getCurrentPricingTier,
  getCurrentPricing,
  formatPriceWithoutZeros,
  formatPrice,
  getCurrencySymbol,
  formatPriceWithSymbol,
  getPriceAmount,
  getTierDisplayName,
  calculatePriceWithVAT,
  calculatePriceWithoutVAT,
  calculateVATAmount,
  getEffectiveVAT,
  getPriceBreakdown,
} from '@/utils/pricing'
import type { ConferencePricing } from '@/types/conference'

describe('Pricing Utilities', () => {
  // Sample pricing configuration for tests
  const samplePricing: ConferencePricing = {
    currency: 'EUR',
    early_bird: {
      amount: 150,
      deadline: '2026-03-01T23:59:59Z',
    },
    regular: {
      amount: 200,
    },
    late: {
      amount: 250,
    },
    student_discount: 50,
    accompanying_person_price: 100,
  }

  describe('getCurrentPricingTier', () => {
    it('should return early_bird when before deadline', () => {
      const currentDate = new Date('2026-02-15')
      const tier = getCurrentPricingTier(samplePricing, currentDate)
      expect(tier).toBe('early_bird')
    })

    it('should return regular when after early bird deadline', () => {
      const currentDate = new Date('2026-03-15')
      const tier = getCurrentPricingTier(samplePricing, currentDate)
      expect(tier).toBe('regular')
    })

    it('should return late when within 14 days of conference', () => {
      const currentDate = new Date('2026-05-20')
      const conferenceStartDate = new Date('2026-05-30')
      const tier = getCurrentPricingTier(samplePricing, currentDate, conferenceStartDate)
      expect(tier).toBe('late')
    })

    it('should return regular when early bird passed but not within late period', () => {
      const currentDate = new Date('2026-04-01')
      const conferenceStartDate = new Date('2026-06-01')
      const tier = getCurrentPricingTier(samplePricing, currentDate, conferenceStartDate)
      expect(tier).toBe('regular')
    })

    it('should return regular when no early bird deadline set', () => {
      const pricingWithoutDeadline: ConferencePricing = {
        ...samplePricing,
        early_bird: { amount: 150 },
      }
      const currentDate = new Date('2026-01-01')
      const tier = getCurrentPricingTier(pricingWithoutDeadline, currentDate)
      expect(tier).toBe('regular')
    })
  })

  describe('getCurrentPricing', () => {
    it('should return correct early bird pricing', () => {
      const currentDate = new Date('2026-02-15')
      const pricing = getCurrentPricing(samplePricing, currentDate)

      expect(pricing.tier).toBe('early_bird')
      expect(pricing.participantPrice).toBe(150)
      expect(pricing.studentPrice).toBe(100) // 150 - 50 discount
      expect(pricing.accompanyingPersonPrice).toBe(100)
      expect(pricing.currency).toBe('EUR')
    })

    it('should return correct regular pricing', () => {
      const currentDate = new Date('2026-03-15')
      const pricing = getCurrentPricing(samplePricing, currentDate)

      expect(pricing.tier).toBe('regular')
      expect(pricing.participantPrice).toBe(200)
      expect(pricing.studentPrice).toBe(150) // 200 - 50 discount
    })

    it('should return correct late pricing', () => {
      const currentDate = new Date('2026-05-20')
      const conferenceStartDate = new Date('2026-05-30')
      const pricing = getCurrentPricing(samplePricing, currentDate, conferenceStartDate)

      expect(pricing.tier).toBe('late')
      expect(pricing.participantPrice).toBe(250)
      expect(pricing.studentPrice).toBe(200) // 250 - 50 discount
    })
  })

  describe('formatPriceWithoutZeros', () => {
    it('should remove trailing zeros from whole numbers', () => {
      expect(formatPriceWithoutZeros(450)).toBe('450')
    })

    it('should remove single trailing zero', () => {
      expect(formatPriceWithoutZeros(450.5)).toBe('450.5')
    })

    it('should keep significant decimal places', () => {
      expect(formatPriceWithoutZeros(450.55)).toBe('450.55')
    })

    it('should handle zero', () => {
      expect(formatPriceWithoutZeros(0)).toBe('0')
    })
  })

  describe('formatPrice', () => {
    it('should format price with currency', () => {
      expect(formatPrice(150, 'EUR')).toBe('150 EUR')
    })

    it('should format price with decimals', () => {
      expect(formatPrice(150.5, 'USD')).toBe('150.5 USD')
    })
  })

  describe('getCurrencySymbol', () => {
    it('should return € for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€')
    })

    it('should return $ for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$')
    })

    it('should return £ for GBP', () => {
      expect(getCurrencySymbol('GBP')).toBe('£')
    })

    it('should handle lowercase currency codes', () => {
      expect(getCurrencySymbol('eur')).toBe('€')
    })

    it('should return currency code for unknown currencies', () => {
      expect(getCurrencySymbol('XYZ')).toBe('XYZ')
    })
  })

  describe('formatPriceWithSymbol', () => {
    it('should format EUR with suffix symbol', () => {
      expect(formatPriceWithSymbol(150, 'EUR')).toBe('150 €')
    })

    it('should format USD with prefix symbol', () => {
      expect(formatPriceWithSymbol(150, 'USD')).toBe('$150')
    })

    it('should format GBP with prefix symbol', () => {
      expect(formatPriceWithSymbol(150, 'GBP')).toBe('£150')
    })
  })

  describe('getPriceAmount', () => {
    it('should return number value directly', () => {
      expect(getPriceAmount(150, 'EUR')).toBe(150)
    })

    it('should return 0 for undefined', () => {
      expect(getPriceAmount(undefined, 'EUR')).toBe(0)
    })

    it('should return correct value for multi-currency object', () => {
      const multiCurrency = { EUR: 150, USD: 170, GBP: 130 }
      expect(getPriceAmount(multiCurrency, 'EUR')).toBe(150)
      expect(getPriceAmount(multiCurrency, 'USD')).toBe(170)
    })

    it('should fallback to first value for unknown currency', () => {
      const multiCurrency = { EUR: 150, USD: 170 }
      expect(getPriceAmount(multiCurrency, 'GBP')).toBe(150)
    })
  })

  describe('getTierDisplayName', () => {
    it('should return correct display names', () => {
      expect(getTierDisplayName('early_bird')).toBe('Early Bird')
      expect(getTierDisplayName('regular')).toBe('Regular')
      expect(getTierDisplayName('late')).toBe('Late Registration')
    })
  })

  describe('VAT Calculations', () => {
    describe('calculatePriceWithVAT', () => {
      it('should calculate price with 25% VAT', () => {
        expect(calculatePriceWithVAT(100, 25)).toBe(125)
      })

      it('should calculate price with 0% VAT', () => {
        expect(calculatePriceWithVAT(100, 0)).toBe(100)
      })
    })

    describe('calculatePriceWithoutVAT', () => {
      it('should calculate base price from VAT-inclusive price', () => {
        expect(calculatePriceWithoutVAT(125, 25)).toBe(100)
      })
    })

    describe('calculateVATAmount', () => {
      it('should calculate VAT amount correctly', () => {
        expect(calculateVATAmount(100, 25)).toBe(25)
      })
    })

    describe('getEffectiveVAT', () => {
      it('should return conference VAT when set', () => {
        expect(getEffectiveVAT(25, 20)).toBe(25)
      })

      it('should return user default when conference VAT is null', () => {
        expect(getEffectiveVAT(null, 20)).toBe(20)
      })

      it('should return null when both are null', () => {
        expect(getEffectiveVAT(null, null)).toBeNull()
      })

      it('should return null when both are undefined', () => {
        expect(getEffectiveVAT(undefined, undefined)).toBeNull()
      })
    })

    describe('getPriceBreakdown', () => {
      it('should return correct breakdown with VAT', () => {
        const breakdown = getPriceBreakdown(100, 25)
        expect(breakdown.withoutVAT).toBe(100)
        expect(breakdown.withVAT).toBe(125)
        expect(breakdown.vatAmount).toBe(25)
        expect(breakdown.vatPercentage).toBe(25)
      })

      it('should return same price when no VAT', () => {
        const breakdown = getPriceBreakdown(100, 0)
        expect(breakdown.withoutVAT).toBe(100)
        expect(breakdown.withVAT).toBe(100)
        expect(breakdown.vatAmount).toBe(0)
      })

      it('should handle undefined VAT', () => {
        const breakdown = getPriceBreakdown(100)
        expect(breakdown.withoutVAT).toBe(100)
        expect(breakdown.withVAT).toBe(100)
        expect(breakdown.vatAmount).toBe(0)
      })
    })
  })
})
