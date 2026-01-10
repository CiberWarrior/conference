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
  } | null // Accommodation details
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

