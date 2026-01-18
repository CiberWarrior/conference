import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import {
  registrationRateLimit,
  getClientIP,
  checkRateLimit,
  createRateLimitHeaders,
} from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Simplified registration schema - all fields are custom and defined by admin
const registrationSchema = z.object({
  conference_id: z.string().uuid(),
  custom_data: z.record(z.any()).optional(), // Custom fields defined by admin
  registration_fee_type: z.string().optional().nullable(), // Selected registration fee type (early_bird, regular, late, student, accompanying_person, or custom_{id})
  participants: z
      .array(
        z.object({
        customFields: z.record(z.any()), // All participant data is now in custom fields
        })
      )
      .optional(),
  accommodation: z.object({
    arrival_date: z.string(),
    departure_date: z.string(),
    number_of_nights: z.number(),
    hotel_id: z.string().nullable().optional(), // Selected hotel ID
  }).optional().nullable(), // Accommodation details (arrival, departure, nights, hotel)
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit(registrationRateLimit, ip)

    if (rateLimitResult && !rateLimitResult.success) {
      const retryAfter = Math.ceil(
        (rateLimitResult.reset - Date.now()) / 1000
      )
      log.warn('Rate limit exceeded for registration', {
        ip,
        retryAfter,
        action: 'registration_rate_limit',
      })
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const body = await request.json()
    log.info('Registration request received', {
      conferenceId: body.conference_id,
      hasCustomData: !!body.custom_data,
      participantsCount: body.participants?.length || 0,
      action: 'registration_attempt',
    })

    const validatedData = registrationSchema.parse(body)
    const supabase = await createServerClient()

    // Verify conference exists and is active
      const { data: conference, error: confError } = await supabase
        .from('conferences')
      .select('id, name, settings')
      .eq('id', validatedData.conference_id)
        .eq('published', true)
        .eq('active', true)
        .single()

      if (confError || !conference) {
      log.warn('Conference not found for registration', {
        conferenceId: validatedData.conference_id,
        action: 'registration_validation',
      })
        return NextResponse.json(
          { error: 'Conference not found or not available' },
          { status: 404 }
        )
      }

      // Check if registration is enabled for this conference
      const settings = conference.settings || {}
      if (settings.registration_enabled === false) {
      log.warn('Registration not enabled for conference', {
        conferenceId: validatedData.conference_id,
        conferenceName: conference.name,
        action: 'registration_validation',
      })
        return NextResponse.json(
          { error: 'Registration is not enabled for this conference' },
          { status: 403 }
        )
      }

    // Extract a "primary" email from custom_data or first participant for duplicate check
    let primaryEmail: string | null = null
    
    // Try to get email from custom_data first
    if (validatedData.custom_data) {
      for (const [key, value] of Object.entries(validatedData.custom_data)) {
        if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')) {
          primaryEmail = value
          break
        }
      }
    }

    // If no email in custom_data, try first participant's customFields
    if (!primaryEmail && validatedData.participants && validatedData.participants.length > 0) {
      const firstParticipant = validatedData.participants[0]
      if (firstParticipant.customFields) {
        // Look for email field in customFields
        for (const [key, value] of Object.entries(firstParticipant.customFields)) {
          if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')) {
            primaryEmail = value
            break
          }
        }
      }
    }

    // Check for duplicate registration if we have a primary email
    if (primaryEmail) {
      const { data: existing } = await supabase
        .from('registrations')
        .select('id')
        .eq('conference_id', validatedData.conference_id)
        .or(`custom_data->>email.eq.${primaryEmail},participants @> '[{"email":"${primaryEmail}"}]'`)
        .maybeSingle()

      if (existing) {
        log.warn('Duplicate registration attempt', {
          conferenceId: validatedData.conference_id,
          email: primaryEmail,
          action: 'registration_validation',
        })
        return NextResponse.json(
          { error: 'This email is already registered for this conference' },
          { status: 400 }
        )
      }
    }

    // Insert registration with simplified data structure
    const { data: registration, error: insertError } = await supabase
      .from('registrations')
      .insert({
        conference_id: validatedData.conference_id,
        custom_data: validatedData.custom_data || {},
        participants: validatedData.participants || [],
        registration_fee_type: validatedData.registration_fee_type || null, // Store selected fee type
        // Note: accommodation is stored in participant_registrations, not here
        payment_status: 'not_required', // Simplified - no payment handling yet
        // Legacy fields set to null/false for compatibility
        first_name: null,
        last_name: null,
        email: primaryEmail || null,
        phone: null,
        country: null,
        institution: null,
        arrival_date: null,
        departure_date: null,
        payment_required: false,
        payment_by_card: false,
        accompanying_persons: false,
        accompanying_persons_data: [],
        gala_dinner: false,
        presentation_type: false,
        abstract_submission: false,
      })
      .select()
      .single()

    if (insertError) {
      log.error('Registration database error', insertError, {
        conferenceId: validatedData.conference_id,
        action: 'create_registration',
        errorDetails: insertError.message,
      })
      return NextResponse.json(
        { 
          error: 'Failed to save registration',
          details: insertError.message || 'Database error occurred',
        },
        { status: 500 }
      )
    }

    log.info('Registration created successfully', {
          registrationId: registration.id,
      conferenceId: validatedData.conference_id,
      conferenceName: conference.name,
      participantsCount: validatedData.participants?.length || 0,
      action: 'registration_success',
        })

    // ============================================
    // PARTICIPANT PROFILE SYSTEM INTEGRATION
    // ============================================
    // Create or link participant profile for the registrant
    if (primaryEmail) {
      try {
        // Extract participant info from custom_data or first participant
        let participantInfo = {
          email: primaryEmail,
          first_name: '',
          last_name: '',
          phone: null as string | null,
          country: null as string | null,
          institution: null as string | null,
        }

        // Try to extract from custom_data
        if (validatedData.custom_data) {
          for (const [key, value] of Object.entries(validatedData.custom_data)) {
            const lowerKey = key.toLowerCase().trim() // Trim whitespace from field names!
            if (lowerKey.includes('first') && lowerKey.includes('name')) {
              participantInfo.first_name = String(value || '')
            } else if (lowerKey.includes('last') && lowerKey.includes('name')) {
              participantInfo.last_name = String(value || '')
            } else if (lowerKey.includes('phone')) {
              participantInfo.phone = String(value || '')
            } else if (lowerKey.includes('country')) {
              participantInfo.country = String(value || '')
            } else if (lowerKey.includes('institution') || lowerKey.includes('organization')) {
              participantInfo.institution = String(value || '')
            }
          }
        }

        // If still no name, try first participant
        if ((!participantInfo.first_name || !participantInfo.last_name) && validatedData.participants && validatedData.participants.length > 0) {
          const firstParticipant = validatedData.participants[0].customFields
          
          for (const [key, value] of Object.entries(firstParticipant)) {
            const lowerKey = key.toLowerCase().trim() // Trim whitespace from field names!
            if (!participantInfo.first_name && lowerKey.includes('first') && lowerKey.includes('name')) {
              participantInfo.first_name = String(value || '')
            } else if (!participantInfo.last_name && lowerKey.includes('last') && lowerKey.includes('name')) {
              participantInfo.last_name = String(value || '')
            } else if (!participantInfo.phone && lowerKey.includes('phone')) {
              participantInfo.phone = String(value || '')
            } else if (!participantInfo.country && lowerKey.includes('country')) {
              participantInfo.country = String(value || '')
            } else if (!participantInfo.institution && (lowerKey.includes('institution') || lowerKey.includes('organization'))) {
              participantInfo.institution = String(value || '')
            }
          }
        }

        // Check if participant profile already exists
        const { data: existingProfile } = await supabase
          .from('participant_profiles')
          .select('id')
          .eq('email', primaryEmail)
          .single()

        let participantProfileId: string

        if (existingProfile) {
          // Use existing profile
          participantProfileId = existingProfile.id
          log.info('Using existing participant profile', {
            participantProfileId,
            email: primaryEmail,
          })
        } else {
          // Create new participant profile
          const { data: newProfile, error: profileError } = await supabase
            .from('participant_profiles')
            .insert({
              email: participantInfo.email,
              first_name: participantInfo.first_name || 'Guest',
              last_name: participantInfo.last_name || 'Participant',
              phone: participantInfo.phone,
              country: participantInfo.country,
              institution: participantInfo.institution,
              has_account: false, // Guest participant (no login yet)
              email_notifications: true,
              marketing_consent: false,
            })
            .select('id')
            .single()

          if (profileError) {
            log.error('Failed to create participant profile', profileError, {
              email: primaryEmail,
            })
            // Don't fail the registration, just log the error
          } else {
            participantProfileId = newProfile.id
            log.info('Created new participant profile', {
              participantProfileId,
              email: primaryEmail,
            })

            // Update registration with participant_profile_id
            const { error: updateError } = await supabase
              .from('registrations')
              .update({ participant_profile_id: participantProfileId })
              .eq('id', registration.id)

            if (updateError) {
              log.error('Failed to update registration with participant_profile_id', updateError)
            } else {
              log.info('Successfully linked registration to participant profile', {
                registrationId: registration.id,
                participantProfileId,
              })
            }

            // Create participant_registration linking record
            const { error: linkError } = await supabase
              .from('participant_registrations')
              .insert({
                participant_id: participantProfileId,
                conference_id: validatedData.conference_id,
                registration_id: registration.id,
                status: 'confirmed',
                custom_data: validatedData.custom_data || {},
                registration_fee_type: validatedData.registration_fee_type,
                payment_status: 'not_required',
                accommodation_data: validatedData.accommodation,
              })

            if (linkError) {
              log.error('Failed to create participant registration link', linkError)
              // Don't fail the registration
            } else {
              log.info('Participant registration link created', {
                participantProfileId,
                conferenceId: validatedData.conference_id,
                registrationId: registration.id,
              })
            }
          }
        }
      } catch (profileError) {
        log.error('Error in participant profile integration', profileError as Error)
        // Don't fail the registration, continue
      }
    }
    // ============================================
    // END PARTICIPANT PROFILE INTEGRATION
    // ============================================

    // TODO: Send confirmation email if email service is configured
    // if (primaryEmail) {
    //   try {
    //     await sendRegistrationConfirmation({
    //       email: primaryEmail,
    //       conferenceName: conference.name,
    //       registrationId: registration.id,
    //     })
    //   } catch (emailError) {
    //     log.warn('Failed to send confirmation email', emailError)
    //   }
    // }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration submitted successfully',
        registrationId: registration.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      log.warn('Registration validation error', {
        errors: error.errors,
        action: 'registration_validation',
      })
      return NextResponse.json(
        {
          error: 'Invalid registration data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    log.error('Registration error', error, {
      action: 'registration_error',
      errorMessage: error.message,
    })

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        message: error.message || 'Please try again later',
      },
      { status: 500 }
    )
  }
}
