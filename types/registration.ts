export type PaymentStatus = 'pending' | 'paid' | 'not_required'

export interface RegistrationData {
  firstName: string
  lastName: string
  email: string
  phone: string
  paymentRequired: boolean
}

export interface Registration extends RegistrationData {
  id: string
  paymentStatus: PaymentStatus
  createdAt: string
  stripeSessionId?: string | null
}

export interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  paymentRequired: boolean
}

