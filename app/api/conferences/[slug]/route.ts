import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import {
  getCachedConference,
  setCachedConference,
  getOrSetCache,
} from '@/lib/cache'
import type { Conference } from '@/types/conference'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/conferences/[slug]
 * Get a published conference by slug (public endpoint)
 * Cached for 1 hour
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Try to get from cache first
    const cached = await getCachedConference(params.slug)
    if (cached) {
      log.debug('Conference cache hit', { slug: params.slug })
      
      // Ensure JSONB fields are properly parsed from cache
      const conference = { ...cached } as Partial<Conference> & { settings?: any; pricing?: any; email_settings?: any }
      if (conference.settings && typeof conference.settings === 'string') {
        try {
          conference.settings = JSON.parse(conference.settings)
        } catch (err) {
          log.warn('Failed to parse cached settings JSON', { slug: params.slug, error: err })
        }
      }
      if (conference.pricing && typeof conference.pricing === 'string') {
        try {
          conference.pricing = JSON.parse(conference.pricing)
        } catch (err) {
          log.warn('Failed to parse cached pricing JSON', { slug: params.slug, error: err })
        }
      }
      if (conference.email_settings && typeof conference.email_settings === 'string') {
        try {
          conference.email_settings = JSON.parse(conference.email_settings)
        } catch (err) {
          log.warn('Failed to parse cached email_settings JSON', { slug: params.slug, error: err })
        }
      }
      
      // Debug: Log custom_abstract_fields from cache
      if (conference.settings?.custom_abstract_fields) {
        log.debug('Custom abstract fields in CACHE', {
          slug: params.slug,
          fields: conference.settings.custom_abstract_fields.map((f: any) => ({
            name: f.name,
            label: f.label,
            type: f.type,
            hasOptions: !!f.options,
            optionsLength: f.options?.length,
          })),
        })
      }

      // Get organizer bank account status (not cached, need fresh data)
      const supabase = await createServerClient()
      let organizer_has_bank_account = false
      if (conference.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('user_profiles')
          .select('bank_account_number')
          .eq('id', conference.owner_id)
          .maybeSingle()
        organizer_has_bank_account = !!ownerProfile?.bank_account_number
      }

      return NextResponse.json(
        { 
          conference,
          organizer_has_bank_account 
        },
        {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', // Disable cache temporarily
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }

    log.debug('Conference cache miss', { slug: params.slug })

    const supabase = await createServerClient()

    const { data: conference, error } = await supabase
      .from('conferences')
      .select('*')
      .eq('slug', params.slug)
      .eq('published', true)
      .eq('active', true)
      .single()

    if (error || !conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Get organizer's bank account status
    let organizer_has_bank_account = false
    if (conference.owner_id) {
      const { data: ownerProfile } = await supabase
        .from('user_profiles')
        .select('bank_account_number')
        .eq('id', conference.owner_id)
        .maybeSingle()
      organizer_has_bank_account = !!ownerProfile?.bank_account_number
    }

    // Ensure JSONB fields are properly parsed (Supabase should do this automatically,
    // but sometimes they might come as strings, especially from cache)
    const parsedConference = conference as any
    if (parsedConference.settings && typeof parsedConference.settings === 'string') {
      try {
        parsedConference.settings = JSON.parse(parsedConference.settings)
      } catch (err) {
        log.warn('Failed to parse settings JSON', { slug: params.slug, error: err })
      }
    }
    if (parsedConference.pricing && typeof parsedConference.pricing === 'string') {
      try {
        parsedConference.pricing = JSON.parse(parsedConference.pricing)
      } catch (err) {
        log.warn('Failed to parse pricing JSON', { slug: params.slug, error: err })
      }
    }
    if (parsedConference.email_settings && typeof parsedConference.email_settings === 'string') {
      try {
        parsedConference.email_settings = JSON.parse(parsedConference.email_settings)
      } catch (err) {
        log.warn('Failed to parse email_settings JSON', { slug: params.slug, error: err })
      }
    }

    // Cache the conference data (async, don't wait)
    setCachedConference(params.slug, parsedConference).catch((err) => {
      log.error('Failed to cache conference', err, {
        slug: params.slug,
        action: 'cache_conference',
      })
    })

    // Debug: Log custom_abstract_fields to verify data
    if (parsedConference.settings?.custom_abstract_fields) {
      log.debug('Custom abstract fields in API response', {
        slug: params.slug,
        fields: parsedConference.settings.custom_abstract_fields.map((f: any) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          hasOptions: !!f.options,
          optionsLength: f.options?.length,
        })),
      })
    }

    return NextResponse.json(
      { 
        conference: parsedConference,
        organizer_has_bank_account 
      },
      {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', // Disable cache temporarily
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    log.error('Get conference by slug error', error, {
      slug: params.slug,
      action: 'get_conference',
    })
    return NextResponse.json(
      { error: 'Failed to fetch conference' },
      { status: 500 }
    )
  }
}

