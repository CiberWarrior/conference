/**
 * Subscription System Types
 */

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_yearly: number
  currency: string
  max_conferences: number
  max_registrations_per_conference: number | null
  max_storage_gb: number | null
  features: string[]
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
  stripe_product_id: string | null
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  inquiry_id: string | null
  status: 'active' | 'past_due' | 'canceled' | 'expired' | 'trialing'
  billing_cycle: 'monthly' | 'yearly'
  price: number
  currency: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null
  starts_at: string
  expires_at: string | null
  canceled_at: string | null
  conferences_used: number
  registrations_used: number
  storage_used_gb: number
  created_at: string
  updated_at: string
}

export interface PaymentOffer {
  id: string
  inquiry_id: string
  plan_id: string
  created_by: string
  billing_cycle: 'monthly' | 'yearly'
  custom_price: number | null
  discount_percent: number
  stripe_payment_link_id: string | null
  stripe_payment_link_url: string | null
  status: 'sent' | 'paid' | 'expired' | 'canceled'
  sent_at: string
  paid_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface CreatePaymentOfferRequest {
  inquiryId: string
  planId: string
  billingCycle: 'monthly' | 'yearly'
  customPrice?: number
  discountPercent?: number
}

export interface CreatePaymentOfferResponse {
  success: boolean
  offerId: string
  paymentLinkUrl: string
  message: string
}

