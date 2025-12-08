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
}

export interface ConferenceSettings {
  registration_enabled: boolean
  abstract_submission_enabled: boolean
  payment_required: boolean
  max_registrations?: number
  timezone: string
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
  pricing?: Partial<ConferencePricing>
  settings?: Partial<ConferenceSettings>
}

export interface UpdateConferenceInput extends Partial<CreateConferenceInput> {
  id: string
  logo_url?: string
  primary_color?: string
  email_settings?: Partial<EmailSettings>
  published?: boolean
  active?: boolean
}

