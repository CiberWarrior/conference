/**
 * Admin Gateway - Helper functions for admin operations that bypass RLS
 * These functions use the admin Supabase client to perform operations
 * that require elevated privileges.
 */

import { createAdminClient } from '@/lib/supabase'
import type { CreateConferenceInput, Conference } from '@/types/conference'
import { log } from '@/lib/logger'

/**
 * Create a conference using admin client (bypasses RLS)
 * @param data Conference data including owner_id and slug
 * @returns Created conference
 */
export async function createConference(
  data: CreateConferenceInput & { owner_id: string; slug: string }
): Promise<Conference> {
  const adminSupabase = createAdminClient()

  const { data: conference, error } = await adminSupabase
    .from('conferences')
    .insert({
      name: data.name,
      slug: data.slug,
      event_type: data.event_type || 'conference',
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
      location: data.location,
      venue: data.venue,
      website_url: data.website_url,
      logo_url: data.logo_url || undefined,
      primary_color: data.primary_color || undefined,
      pricing: data.pricing || undefined,
      settings: data.settings || undefined,
      email_settings: data.email_settings || undefined,
      owner_id: data.owner_id,
    })
    .select()
    .single()

  if (error) {
    log.error('Create conference error in admin gateway', error, {
      conferenceName: data.name,
      slug: data.slug,
      errorMessage: error.message,
      errorCode: error.code,
      action: 'create_conference',
    })
    throw new Error(`Failed to create conference: ${error.message}`)
  }

  if (!conference) {
    throw new Error('Conference creation returned no data')
  }

  return conference as Conference
}

/**
 * Create a conference permission using admin client (bypasses RLS)
 * @param data Permission data
 * @returns Created permission
 */
export async function createConferencePermission(data: {
  user_id: string
  conference_id: string
  can_view_registrations?: boolean
  can_export_data?: boolean
  can_manage_payments?: boolean
  can_manage_abstracts?: boolean
  can_check_in?: boolean
  can_generate_certificates?: boolean
  can_edit_conference?: boolean
  can_delete_data?: boolean
  granted_by: string
}): Promise<void> {
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.from('conference_permissions').insert({
    user_id: data.user_id,
    conference_id: data.conference_id,
    can_view_registrations: data.can_view_registrations ?? true,
    can_export_data: data.can_export_data ?? true,
    can_manage_payments: data.can_manage_payments ?? true,
    can_manage_abstracts: data.can_manage_abstracts ?? true,
    can_check_in: data.can_check_in ?? true,
    can_generate_certificates: data.can_generate_certificates ?? true,
    can_edit_conference: data.can_edit_conference ?? true,
    can_delete_data: data.can_delete_data ?? true,
    granted_by: data.granted_by,
  })

  if (error) {
    log.error('Create conference permission error in admin gateway', error, {
      userId: data.user_id,
      conferenceId: data.conference_id,
      errorMessage: error.message,
      errorCode: error.code,
      action: 'create_conference_permission',
    })
    throw new Error(`Failed to create conference permission: ${error.message}`)
  }
}
