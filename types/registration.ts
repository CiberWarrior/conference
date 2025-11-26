export type PaymentStatus = 'pending' | 'paid' | 'not_required'

export interface RegistrationData {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  institution: string
  arrivalDate: string
  departureDate: string
  paymentRequired: boolean
  paymentByCard: boolean
}

export interface Registration extends RegistrationData {
  id: string
  paymentStatus: PaymentStatus
  createdAt: string
  stripeSessionId?: string | null
  paymentIntentId?: string | null
  invoiceId?: string | null
  invoiceUrl?: string | null
  checkedIn?: boolean
  checkedInAt?: string | null
}

export interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  institution: string
  arrivalDate: string
  departureDate: string
  paymentRequired: boolean
  paymentByCard: boolean
}

