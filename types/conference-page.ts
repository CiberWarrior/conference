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
  hero_layout_type?: string | null
  hero_logo_url?: string | null
  hero_info_cards?: any | null
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  custom_css?: string | null
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
  hero_layout_type?: string | null
  hero_logo_url?: string | null
  hero_info_cards?: any | null
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  custom_css?: string | null
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
  hero_layout_type?: string | null
  hero_logo_url?: string | null
  hero_info_cards?: any | null
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  custom_css?: string | null
}

