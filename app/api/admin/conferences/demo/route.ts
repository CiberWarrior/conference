/**
 * POST /api/admin/conferences/demo
 * Create a demo/test conference with pre-filled data for testing patterns
 * Super Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createConference, createConferencePermission } from '@/lib/admin-gateway'
import { ApiError, handleApiError, apiSuccess } from '@/lib/api-error'
import { requireSuperAdmin } from '@/lib/api-auth'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Create a demo conference with sample data for testing
 */
export async function POST(request: NextRequest) {
  try {
    // Require super admin authentication
    const { user, profile, supabase } = await requireSuperAdmin()

    // Get optional template name from body (optional)
    const body = await request.json().catch(() => ({}))
    const template = (body.template as string) || 'full-featured'

    // Generate unique slug with timestamp
    const timestamp = Date.now().toString(36)
    const baseSlug = 'demo-conference'
    let slug = `${baseSlug}-${timestamp}`

    // Check if slug already exists (shouldn't happen with timestamp, but just in case)
    const { data: existing } = await supabase
      .from('conferences')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      // Add random suffix if somehow exists
      const randomSuffix = Math.random().toString(36).substring(2, 6)
      slug = `${baseSlug}-${timestamp}-${randomSuffix}`
    }

    // Demo conference data based on template
    let demoData: Parameters<typeof createConference>[0]

    if (template === 'minimal') {
      // Minimal template - just basic info
      demoData = {
        name: 'Demo Conference - Minimal',
        slug,
        event_type: 'conference',
        description: 'This is a minimal demo conference for testing basic registration patterns.',
        start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 32 days from now
        location: 'Zagreb, Croatia',
        venue: 'Hotel Sheraton',
        website_url: undefined,
        logo_url: undefined,
        primary_color: '#3B82F6',
        pricing: {
          currency: 'EUR',
          regular: {
            amount: 200,
          },
        },
        settings: {
          registration_enabled: true,
          abstract_submission_enabled: false,
          payment_required: true,
          max_registrations: undefined,
          timezone: 'Europe/Zagreb',
        },
        email_settings: {
          from_email: undefined,
          from_name: undefined,
          reply_to: undefined,
        },
        owner_id: profile.id,
      }
    } else {
      // Full-featured template (default) - complete setup
      const startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      const endDate = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000) // 32 days from now
      const earlyBirdDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 10 days from now

      demoData = {
        name: 'Demo Conference - Full Featured',
        slug,
        event_type: 'conference',
        description: `This is a comprehensive demo conference for testing all registration patterns, payment flows, and page templates.

**Features included:**
- Multiple pricing tiers (Early Bird, Regular, Late, Student)
- Custom registration fields
- Abstract submission
- Accommodation options
- Multiple participants support
- VAT handling
- All page templates ready to use

**Test URLs:**
- Registration: /conferences/${slug}/register
- Enhanced Registration: /conferences/${slug}/register-v2
- Public Pages: /conferences/${slug}/p/[page-slug]
- Contact Form: /conferences/${slug}/contact`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        location: 'Zagreb, Croatia',
        venue: 'Hotel Sheraton - Grand Ballroom',
        website_url: `https://demo-conference.example.com`,
        logo_url: undefined,
        primary_color: '#3B82F6',
        pricing: {
          currency: 'EUR',
          early_bird: {
            amount: 150,
            deadline: earlyBirdDeadline,
          },
          regular: {
            amount: 200,
          },
          late: {
            amount: 250,
          },
          student_discount: 50,
          accompanying_person_price: 140,
        },
        settings: {
          registration_enabled: true,
          abstract_submission_enabled: true,
          payment_required: true,
          max_registrations: undefined,
          timezone: 'Europe/Zagreb',
          vat_percentage: 25,
          prices_include_vat: false,
          custom_registration_fields: [
            {
              id: 'dietary',
              name: 'dietary_requirements',
              label: 'Dietary Requirements',
              type: 'select',
              required: false,
              options: [
                'No special requirements',
                'Vegetarian',
                'Vegan',
                'Gluten Free',
                'Halal',
                'Kosher',
                'Other (please specify)',
              ],
            },
            {
              id: 'tshirt',
              name: 'tshirt_size',
              label: 'T-Shirt Size',
              type: 'select',
              required: false,
              options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            },
            {
              id: 'badge',
              name: 'badge_name',
              label: 'Name for Badge',
              type: 'text',
              required: false,
              placeholder: 'How you want your name to appear on the badge',
            },
          ],
          custom_abstract_fields: [
            {
              id: 'presentation_type',
              name: 'presentation_type',
              label: 'Presentation Type',
              type: 'select',
              required: true,
              options: ['Oral Presentation', 'Poster Presentation', 'Workshop'],
            },
            {
              id: 'keywords',
              name: 'keywords',
              label: 'Keywords',
              type: 'text',
              required: false,
              placeholder: 'Comma-separated keywords',
            },
          ],
        },
        email_settings: {
          from_email: 'noreply@demo-conference.example.com',
          from_name: 'Demo Conference Team',
          reply_to: 'info@demo-conference.example.com',
        },
        owner_id: profile.id,
      }
    }

    // Create conference using admin gateway
    let conference
    try {
      conference = await createConference(demoData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw ApiError.database(`Failed to create demo conference: ${errorMessage}`)
    }

    // Auto-create permission for the creator (super admin)
    try {
      await createConferencePermission({
        user_id: profile.id,
        conference_id: conference.id,
        can_view_registrations: true,
        can_export_data: true,
        can_manage_payments: true,
        can_manage_abstracts: true,
        can_check_in: true,
        can_generate_certificates: true,
        can_edit_conference: true,
        can_delete_data: true,
        granted_by: profile.id,
      })
    } catch (permError) {
      log.error('Error creating permission for demo conference', permError instanceof Error ? permError : undefined, {
        userId: profile.id,
        conferenceId: conference.id,
        action: 'create_demo_conference_permission',
      })
      // Don't fail the request, just log the error
    }

    log.info('Demo conference created successfully', {
      userId: profile.id,
      conferenceId: conference.id,
      conferenceName: conference.name,
      slug: conference.slug,
      template,
      action: 'create_demo_conference',
    })

    return apiSuccess(
      {
        conference,
        testUrls: {
          registration: `/conferences/${conference.slug}/register`,
          enhancedRegistration: `/conferences/${conference.slug}/register-v2`,
          publicPage: `/conferences/${conference.slug}`,
          contactForm: `/conferences/${conference.slug}/contact`,
          adminDashboard: `/admin/conferences/${conference.id}`,
          adminPages: `/admin/conferences/${conference.id}/pages`,
        },
      },
      'Demo conference created successfully',
      201
    )
  } catch (error) {
    return handleApiError(error, { action: 'create_demo_conference' })
  }
}
