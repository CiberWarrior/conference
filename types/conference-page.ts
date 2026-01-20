export interface ConferencePage {
  id: string
  conference_id: string
  slug: string
  title: string
  content: string
  sort_order: number
  published: boolean
  hero_title?: string | null
  hero_subtitle?: string | null
  hero_image_url?: string | null
  hero_background_color?: string | null
  created_at: string
  updated_at: string
}

export interface CreateConferencePageInput {
  title: string
  slug: string
  content?: string
  sort_order?: number
  published?: boolean
  hero_title?: string | null
  hero_subtitle?: string | null
  hero_image_url?: string | null
  hero_background_color?: string | null
}

export interface UpdateConferencePageInput {
  title?: string
  slug?: string
  content?: string
  sort_order?: number
  published?: boolean
  hero_title?: string | null
  hero_subtitle?: string | null
  hero_image_url?: string | null
  hero_background_color?: string | null
}

