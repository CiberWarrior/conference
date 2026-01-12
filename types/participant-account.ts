/**
 * PARTICIPANT ACCOUNT SYSTEM TYPES
 * Types for participant profiles, registrations, and loyalty system
 */

// ============================================
// PARTICIPANT PROFILE
// ============================================

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface ParticipantProfile {
  id: string
  auth_user_id?: string | null // Link to auth.users (NULL if no account)
  email: string
  first_name: string
  last_name: string
  phone?: string | null
  country?: string | null
  institution?: string | null
  has_account: boolean
  account_activated_at?: string | null
  profile_data?: Record<string, any>
  avatar_url?: string | null
  email_notifications: boolean
  marketing_consent: boolean
  total_events_attended: number
  loyalty_tier: LoyaltyTier
  loyalty_points: number
  created_at: string
  updated_at: string
  last_login?: string | null
}

export interface CreateParticipantProfileInput {
  email: string
  first_name: string
  last_name: string
  phone?: string
  country?: string
  institution?: string
  profile_data?: Record<string, any>
  has_account?: boolean
  email_notifications?: boolean
  marketing_consent?: boolean
}

export interface UpdateParticipantProfileInput {
  first_name?: string
  last_name?: string
  phone?: string
  country?: string
  institution?: string
  profile_data?: Record<string, any>
  avatar_url?: string
  email_notifications?: boolean
  marketing_consent?: boolean
}

// ============================================
// PARTICIPANT REGISTRATION
// ============================================

export type ParticipantRegistrationStatus =
  | 'confirmed'
  | 'cancelled'
  | 'attended'
  | 'no_show'

export type ParticipantPaymentStatus = 'pending' | 'paid' | 'refunded' | 'not_required'

export interface ParticipantRegistration {
  id: string
  participant_id: string
  conference_id: string
  registration_id?: string | null
  status: ParticipantRegistrationStatus
  custom_data?: Record<string, any>
  registration_fee_type?: string | null
  amount_paid?: number | null
  currency?: string | null
  payment_status: ParticipantPaymentStatus
  payment_intent_id?: string | null
  checked_in: boolean
  checked_in_at?: string | null
  certificate_id?: string | null
  certificate_issued_at?: string | null
  accommodation_data?: {
    hotel_id?: string
    arrival_date: string
    departure_date: string
    number_of_nights: number
  } | null
  abstract_submitted: boolean
  abstract_id?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  refund_issued: boolean
  refund_amount?: number | null
  registered_at: string
  updated_at: string
}

export interface CreateParticipantRegistrationInput {
  participant_id: string
  conference_id: string
  registration_id?: string
  custom_data?: Record<string, any>
  registration_fee_type?: string
  amount_paid?: number
  currency?: string
  payment_status?: ParticipantPaymentStatus
  accommodation_data?: {
    hotel_id?: string
    arrival_date: string
    departure_date: string
    number_of_nights: number
  }
}

export interface CancelRegistrationInput {
  reason?: string
  request_refund: boolean
}

// ============================================
// PARTICIPANT REGISTRATION WITH DETAILS
// ============================================
// Extended type with conference details for displaying in participant dashboard

export interface ParticipantRegistrationWithDetails extends ParticipantRegistration {
  conference: {
    id: string
    name: string
    slug: string
    event_type?: string
    start_date?: string
    end_date?: string
    location?: string
    logo_url?: string
    primary_color?: string
  }
  certificate?: {
    id: string
    certificate_url: string
    issued_at: string
  } | null
}

// ============================================
// ACCOUNT INVITES
// ============================================

export type InviteStatus = 'pending' | 'accepted' | 'expired'

export interface ParticipantAccountInvite {
  id: string
  participant_id: string
  email: string
  invite_token: string
  status: InviteStatus
  sent_at: string
  expires_at: string
  accepted_at?: string | null
}

export interface SendAccountInviteInput {
  participant_id: string
  email: string
}

// ============================================
// LOYALTY DISCOUNTS
// ============================================

export type DiscountType = 'returning_participant' | 'loyalty_tier' | 'custom'

export interface ParticipantLoyaltyDiscount {
  id: string
  participant_id: string
  conference_id: string
  discount_type: DiscountType
  discount_percentage?: number | null
  discount_amount?: number | null
  applied: boolean
  applied_at?: string | null
  valid_from: string
  valid_until?: string | null
  created_at: string
}

export interface CreateLoyaltyDiscountInput {
  participant_id: string
  conference_id: string
  discount_type: DiscountType
  discount_percentage?: number
  discount_amount?: number
  valid_until?: string
}

// ============================================
// AUTH & LOGIN
// ============================================

export interface ParticipantLoginInput {
  email: string
  password?: string // Optional - can use magic link instead
}

export interface ParticipantMagicLinkInput {
  email: string
  redirect_to?: string
}

export interface ParticipantSignupInput {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
  country?: string
  institution?: string
}

export interface ActivateAccountInput {
  invite_token: string
  password: string
}

// ============================================
// DASHBOARD DATA
// ============================================

export interface ParticipantDashboardData {
  profile: ParticipantProfile
  registrations: ParticipantRegistrationWithDetails[]
  upcoming_events: ParticipantRegistrationWithDetails[]
  past_events: ParticipantRegistrationWithDetails[]
  available_discounts: ParticipantLoyaltyDiscount[]
  loyalty_info: {
    tier: LoyaltyTier
    points: number
    events_attended: number
    next_tier: LoyaltyTier | null
    events_until_next_tier: number
  }
}

// ============================================
// LOYALTY TIER BENEFITS
// ============================================

export interface LoyaltyTierBenefits {
  tier: LoyaltyTier
  discount_percentage: number
  benefits: string[]
  events_required: number
}

export const LOYALTY_TIERS: Record<LoyaltyTier, LoyaltyTierBenefits> = {
  bronze: {
    tier: 'bronze',
    discount_percentage: 0,
    benefits: ['Access to participant dashboard', 'Event history tracking'],
    events_required: 0,
  },
  silver: {
    tier: 'silver',
    discount_percentage: 5,
    benefits: [
      '5% discount on future events',
      'Priority registration',
      'Early bird notifications',
    ],
    events_required: 3,
  },
  gold: {
    tier: 'gold',
    discount_percentage: 10,
    benefits: [
      '10% discount on future events',
      'Priority check-in',
      'Exclusive networking events',
      'Free certificate download',
    ],
    events_required: 6,
  },
  platinum: {
    tier: 'platinum',
    discount_percentage: 15,
    benefits: [
      '15% discount on future events',
      'VIP status',
      'Complimentary upgrades',
      'Dedicated support',
      'Lifetime access to all certificates',
    ],
    events_required: 11,
  },
}

// Helper function to get next tier
export function getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
  const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum']
  const currentIndex = tiers.indexOf(currentTier)
  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null
  }
  return tiers[currentIndex + 1]
}

// Helper function to calculate events until next tier
export function getEventsUntilNextTier(
  currentEvents: number,
  currentTier: LoyaltyTier
): number {
  const nextTier = getNextTier(currentTier)
  if (!nextTier) return 0

  const nextTierRequirement = LOYALTY_TIERS[nextTier].events_required
  return Math.max(0, nextTierRequirement - currentEvents)
}
