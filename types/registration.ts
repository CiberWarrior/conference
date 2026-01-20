import type { Participant } from './participant'

export type PaymentStatus = 'pending' | 'paid' | 'not_required'

export interface AccompanyingPerson {
  firstName: string
  lastName: string
  arrivalDate: string
  departureDate: string
}

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
  accompanyingPersons: boolean
  accompanyingPersonsData?: AccompanyingPerson[]
  galaDinner: boolean
  presentationType: boolean
  abstractSubmission: boolean
}

export interface Registration extends RegistrationData {
  id: string
  registration_number?: string // Auto-generated conference-specific number (e.g., ICD11-001)
  paymentStatus: PaymentStatus
  createdAt: string
  stripeSessionId?: string | null
  paymentIntentId?: string | null
  invoiceId?: string | null
  invoiceUrl?: string | null
  checkedIn?: boolean
  checkedInAt?: string | null
  customFields?: Record<string, any>
  participants?: Participant[] // Multiple participants support
  registrationFeeType?: string | null // Type of registration fee: early_bird, regular, late, student, accompanying_person
  accommodation?: {
    arrival_date: string
    departure_date: string
    number_of_nights: number
    hotel_id?: string | null // Selected hotel ID
  } | null // Accommodation details
  // Multi-currency & bank transfer support
  payment_method?: 'card' | 'bank_transfer' | 'cash' | 'other' // Method of payment
  payment_reference?: string | null // Unique payment reference (poziv na broj)
  payment_currency?: string // Currency used for this payment (e.g., 'EUR', 'USD')
  payment_amount?: number // Amount paid in selected currency
  bank_transfer_proof_url?: string | null // URL to uploaded proof of bank transfer
  bank_transfer_verified?: boolean // Whether bank transfer was manually verified by admin
  bank_transfer_verified_at?: string | null // When bank transfer was verified
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
  accompanyingPersons: boolean
  accompanyingPersonsData?: AccompanyingPerson[]
  galaDinner: boolean
  presentationType: boolean
  abstractSubmission: boolean
  customFields?: Record<string, any> // Custom polja koja korisnik definira
}

