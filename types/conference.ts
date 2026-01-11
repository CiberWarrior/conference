export interface Conference {
  id: string
  name: string
  slug: string
  description?: string

  // Event Details
  start_date?: string
  end_date?: string
  location?: string
  venue?: string

  // Branding
  logo_url?: string
  website_url?: string
  primary_color?: string

  // Pricing
  pricing: ConferencePricing

  // Settings
  settings: ConferenceSettings

  // Email Configuration
  email_settings: EmailSettings

  // Ownership
  owner_id: string

  // Status
  active: boolean
  published: boolean

  // Timestamps
  created_at: string
  updated_at: string
}

export interface CustomPricingField {
  id: string
  name: string // Naziv polja (npr. "VIP Price", "Group Discount")
  value: number // Vrijednost/cijena
  description: string // Opis polja
}

export interface HotelOption {
  id: string
  name: string // Naziv hotela i tip sobe (npr. "HOTEL VIS / KOMODOR 3 - Double SINGLE USE room standard park view")
  occupancy: string // "1 person", "2 people", etc.
  pricePerNight: number // Cijena po noći
  description?: string // Dodatne informacije
  order: number // Redoslijed prikazivanja
  available_from?: string // ISO date string - od kada je hotel dostupan za rezervacije
  available_until?: string // ISO date string - do kada je hotel dostupan za rezervacije
  max_rooms?: number // Maksimalni broj soba dostupan za rezervaciju (opcionalno)
}

export interface ConferencePricing {
  currency: string
  early_bird: {
    amount: number
    deadline?: string // ISO date string
  }
  regular: {
    amount: number
  }
  late: {
    amount: number
  }
  student_discount: number
  accompanying_person_price?: number // Price for accompanying persons (early bird)
  custom_fields?: CustomPricingField[] // Custom pricing polja koja korisnik definira
}

export interface CustomRegistrationField {
  id: string
  name: string // Naziv polja (npr. "Dietary Requirements", "Special Needs")
  type: 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'radio' | 'checkbox' | 'separator' // Tip polja
  label: string // Label koji se prikazuje u formi (za separator, ovo je naslov sekcije)
  placeholder?: string // Placeholder tekst
  description?: string // Opis polja (help text)
  required: boolean // Je li polje obavezno (separator nikad nije required)
  options?: string[] // Opcije za select tip (razdvojene zarezom ili array)
  validation?: {
    min?: number // Minimalna vrijednost za number
    max?: number // Maksimalna vrijednost za number
    minLength?: number // Minimalna duljina za text
    maxLength?: number // Maksimalna duljina za text
    pattern?: string // Regex pattern za validaciju
  }
}

export interface ParticipantSettings {
  enabled: boolean
  minParticipants: number
  maxParticipants: number
  requireUniqueEmails: boolean
  participantFields: string[]
  customFieldsPerParticipant: boolean
  participantLabel?: string
}

export interface ConferenceSettings {
  registration_enabled: boolean
  abstract_submission_enabled: boolean
  payment_required: boolean
  max_registrations?: number
  timezone: string
  registration_info_text?: string // Informativni tekst koji se prikazuje na vrhu registration forme
  abstract_info_text?: string // Informativni tekst koji se prikazuje na vrhu abstract submission forme
  custom_registration_fields?: CustomRegistrationField[] // Custom polja za registracijski obrazac
  custom_abstract_fields?: CustomRegistrationField[] // Custom polja za abstract submission obrazac
  participant_settings?: ParticipantSettings // Settings for multiple participants
  hotel_options?: HotelOption[] // Dostupni hoteli za accommodation
}

export interface EmailSettings {
  from_email?: string
  from_name?: string
  reply_to?: string
}

export interface CreateConferenceInput {
  name: string
  description?: string
  start_date?: string
  end_date?: string
  location?: string
  venue?: string
  website_url?: string
  logo_url?: string
  primary_color?: string
  pricing?: Partial<ConferencePricing>
  settings?: Partial<ConferenceSettings>
  email_settings?: Partial<EmailSettings>
}

export interface UpdateConferenceInput extends Partial<CreateConferenceInput> {
  id: string
  logo_url?: string
  primary_color?: string
  email_settings?: Partial<EmailSettings>
  published?: boolean
  active?: boolean
}

