/**
 * LOYALTY DISCOUNT SYSTEM
 * Automatically applies discounts for returning participants
 */

import { createServerClient } from './supabase'
import { log } from './logger'
import type { LoyaltyTier } from '@/types/participant-account'

export interface LoyaltyDiscountResult {
  eligible: boolean
  discount_percentage: number
  discount_amount?: number
  reason: string
  tier: LoyaltyTier
  events_attended: number
}

/**
 * Check if participant is eligible for loyalty discount
 * @param email Participant email
 * @param conferenceId Conference ID
 * @param originalAmount Original registration amount
 * @returns Discount result
 */
export async function checkLoyaltyDiscount(
  email: string,
  conferenceId: string,
  originalAmount: number
): Promise<LoyaltyDiscountResult> {
  try {
    const supabase = await createServerClient()

    // Get participant profile
    const { data: profile, error: profileError } = await supabase
      .from('participant_profiles')
      .select('id, loyalty_tier, total_events_attended, loyalty_points')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      // Not a returning participant
      return {
        eligible: false,
        discount_percentage: 0,
        reason: 'First time participant',
        tier: 'bronze',
        events_attended: 0,
      }
    }

    // Check if participant already registered for this conference
    const { data: existingReg } = await supabase
      .from('participant_registrations')
      .select('id')
      .eq('participant_id', profile.id)
      .eq('conference_id', conferenceId)
      .neq('status', 'cancelled')
      .single()

    if (existingReg) {
      return {
        eligible: false,
        discount_percentage: 0,
        reason: 'Already registered for this event',
        tier: profile.loyalty_tier as LoyaltyTier,
        events_attended: profile.total_events_attended,
      }
    }

    // Calculate discount based on loyalty tier
    let discountPercentage = 0
    let reason = ''

    switch (profile.loyalty_tier) {
      case 'platinum':
        discountPercentage = 15
        reason = 'Platinum tier loyalty discount (11+ events)'
        break
      case 'gold':
        discountPercentage = 10
        reason = 'Gold tier loyalty discount (6-10 events)'
        break
      case 'silver':
        discountPercentage = 5
        reason = 'Silver tier loyalty discount (3-5 events)'
        break
      default:
        // Bronze tier - no automatic discount
        // But they're still a returning participant
        if (profile.total_events_attended > 0) {
          discountPercentage = 0
          reason = `Returning participant (${profile.total_events_attended} events attended)`
        } else {
          return {
            eligible: false,
            discount_percentage: 0,
            reason: 'First time participant',
            tier: 'bronze',
            events_attended: 0,
          }
        }
    }

    const discountAmount = (originalAmount * discountPercentage) / 100

    log.info('Loyalty discount calculated', {
      participantId: profile.id,
      email,
      tier: profile.loyalty_tier,
      events_attended: profile.total_events_attended,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
    })

    return {
      eligible: discountPercentage > 0,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      reason,
      tier: profile.loyalty_tier as LoyaltyTier,
      events_attended: profile.total_events_attended,
    }
  } catch (error) {
    log.error('Error checking loyalty discount', error as Error)
    return {
      eligible: false,
      discount_percentage: 0,
      reason: 'Error checking discount eligibility',
      tier: 'bronze',
      events_attended: 0,
    }
  }
}

/**
 * Apply loyalty discount to a registration
 * Creates a discount record and returns the discounted amount
 */
export async function applyLoyaltyDiscount(
  participantProfileId: string,
  conferenceId: string,
  originalAmount: number,
  tier: LoyaltyTier,
  discountPercentage: number
): Promise<{ success: boolean; discountedAmount: number; discountId?: string }> {
  try {
    const supabase = await createServerClient()

    const discountAmount = (originalAmount * discountPercentage) / 100
    const discountedAmount = originalAmount - discountAmount

    // Create loyalty discount record
    const { data: discount, error: discountError } = await supabase
      .from('participant_loyalty_discounts')
      .insert({
        participant_id: participantProfileId,
        conference_id: conferenceId,
        discount_type: 'loyalty_tier',
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        applied: true,
        applied_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (discountError) {
      log.error('Failed to create loyalty discount record', discountError)
      return {
        success: false,
        discountedAmount: originalAmount,
      }
    }

    log.info('Loyalty discount applied', {
      participantId: participantProfileId,
      conferenceId,
      discountId: discount.id,
      originalAmount,
      discountAmount,
      discountedAmount,
      tier,
    })

    return {
      success: true,
      discountedAmount,
      discountId: discount.id,
    }
  } catch (error) {
    log.error('Error applying loyalty discount', error as Error)
    return {
      success: false,
      discountedAmount: originalAmount,
    }
  }
}

/**
 * Get loyalty discount for display (before registration)
 * For showing discount info during registration process
 */
export async function getLoyaltyDiscountInfo(
  email: string
): Promise<{
  hasDiscount: boolean
  tier: LoyaltyTier
  discountPercentage: number
  eventsAttended: number
  message: string
} | null> {
  try {
    const supabase = await createServerClient()

    const { data: profile } = await supabase
      .from('participant_profiles')
      .select('loyalty_tier, total_events_attended, loyalty_points')
      .eq('email', email)
      .single()

    if (!profile) {
      return null
    }

    let discountPercentage = 0
    let message = ''

    switch (profile.loyalty_tier) {
      case 'platinum':
        discountPercentage = 15
        message = '🎉 Platinum Member! You get 15% OFF on all events!'
        break
      case 'gold':
        discountPercentage = 10
        message = '⭐ Gold Member! You get 10% OFF on all events!'
        break
      case 'silver':
        discountPercentage = 5
        message = '🥈 Silver Member! You get 5% OFF on all events!'
        break
      default:
        if (profile.total_events_attended > 0) {
          message = `👋 Welcome back! You've attended ${profile.total_events_attended} event(s). Attend 3+ events to unlock Silver tier benefits!`
        } else {
          return null
        }
    }

    return {
      hasDiscount: discountPercentage > 0,
      tier: profile.loyalty_tier as LoyaltyTier,
      discountPercentage,
      eventsAttended: profile.total_events_attended,
      message,
    }
  } catch (error) {
    log.error('Error getting loyalty discount info', error as Error)
    return null
  }
}
