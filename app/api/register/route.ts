import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ZodError } from 'zod'
import type { ConferencePricing } from '@/types/conference'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { log } from '@/lib/logger'
import {
  registrationRateLimit,
  getClientIP,
  checkRateLimit,
  createRateLimitHeaders,
} from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}


// Payer type and company details (for invoicing / billing)
const companyDetailsSchema = z
  .object({
    vat_number: z.string().nullable().optional(),
    no_vat: z.boolean().optional().default(false),
    company_name: z.string().min(1),
    country: z.string().min(1),
    city: z.string().min(1),
    postal_code: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().nullable().optional(),
  })
  .optional()
  .nullable()

// Simplified registration schema - all fields are custom and defined by admin
const registrationSchema = z.object({
  conference_id: z.string().uuid(),
  custom_data: z.record(z.any()).optional(), // Custom fields defined by admin
  registration_fee_type: z.string().optional().nullable(), // Selected registration fee type (early_bird, regular, late, student, accompanying_person, or custom_{id})
  // Pay Later removed from product; keep only immediate options
  payment_preference: z.enum(['pay_now_card', 'pay_now_bank']).optional().default('pay_now_card'), // Payment preference
  participants: z
    .array(
      z.object({
        customFields: z.record(z.any()), // All participant data is now in custom fields
      })
    )
    .optional(),
  accommodation: z
    .object({
      arrival_date: z.string(),
      departure_date: z.string(),
      number_of_nights: z.number(),
      hotel_id: z.string().nullable().optional(), // Selected hotel ID
    })
    .optional()
    .nullable(), // Accommodation details (arrival, departure, nights, hotel)
  // Payer type: person or company; company_details required when payer_type === 'company'
  payer_type: z.enum(['person', 'company']).optional().default('person'),
  company_details: companyDetailsSchema,
  // Jezik e-maila potvrde: 'hr' ili 'en'
  locale: z.enum(['hr', 'en']).optional().default('en'),
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
      .select('id, name, settings, email_settings')
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

    // Determine payment method and status based on payment preference
    let paymentMethod: string | null = null
    let paymentStatus: string = 'not_required'
    
    if (validatedData.payment_preference === 'pay_now_card') {
      paymentMethod = 'card'
      paymentStatus = 'pending'
    } else if (validatedData.payment_preference === 'pay_now_bank') {
      paymentMethod = 'bank_transfer'
      paymentStatus = 'pending'
    }

    // Merge payer_type and company_details into custom_data for storage and admin display
    const customDataWithPayer = {
      ...(validatedData.custom_data || {}),
      payer_type: validatedData.payer_type ?? 'person',
      company_details: validatedData.company_details ?? null,
    }

    // Insert registration with simplified data structure
    const { data: registration, error: insertError } = await supabase
      .from('registrations')
      .insert({
        conference_id: validatedData.conference_id,
        custom_data: customDataWithPayer,
        participants: validatedData.participants || [],
        registration_fee_type: validatedData.registration_fee_type || null, // Store selected fee type
        payment_method: paymentMethod, // Payment method: card, bank_transfer, or null
        payment_status: paymentStatus, // Payment status based on preference
        accommodation: validatedData.accommodation || null, // Store accommodation in registrations table as well
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
    // AUTO-CREATE TICKET WHEN HOTEL REACHES CAPACITY
    // ============================================
    const hotelId = validatedData.accommodation?.hotel_id
    if (hotelId && conference.settings?.hotel_options) {
      const hotelOptions = conference.settings.hotel_options as Array<{ id: string; name?: string; max_rooms?: number }>
      const hotel = hotelOptions.find((h) => h.id === hotelId)
      const maxRooms = hotel?.max_rooms
      if (typeof maxRooms === 'number' && maxRooms > 0) {
        const { data: allRegs } = await supabase
          .from('registrations')
          .select('id, accommodation')
          .eq('conference_id', validatedData.conference_id)
          .not('accommodation', 'is', null)
        const count = allRegs?.filter((r) => (r.accommodation as { hotel_id?: string })?.hotel_id === hotelId).length ?? 0
        if (count >= maxRooms) {
          try {
            const adminSupabase = createAdminClient()
            const marker = `Hotel ID: ${hotelId}`
            const { data: existing } = await adminSupabase
              .from('support_tickets')
              .select('id')
              .eq('conference_id', validatedData.conference_id)
              .eq('category', 'accommodation_full')
              .like('description', `%${marker}%`)
              .limit(1)
              .maybeSingle()
            if (!existing) {
              await adminSupabase.from('support_tickets').insert({
                subject: `Smještaj popunjen: ${String(hotel?.name || hotelId).slice(0, 200)}`,
                description: `${marker}. Sve rezervirane sobe su popunjene.`,
                status: 'open',
                priority: 'high',
                category: 'accommodation_full',
                conference_id: validatedData.conference_id,
                created_by_user_id: null,
                created_by_email: null,
              })
              log.info('Auto-created support ticket for full hotel', {
                conferenceId: validatedData.conference_id,
                hotelId,
                count,
                maxRooms,
                action: 'ticket_auto_create',
              })
            }
          } catch (ticketErr) {
            log.error('Auto-create ticket for full hotel failed', ticketErr, {
              conferenceId: validatedData.conference_id,
              hotelId,
              action: 'ticket_auto_create',
            })
          }
        }
      }
    }

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

    // Send confirmation email to participant (with summary of what they filled in)
    if (primaryEmail) {
      try {
        const { sendRegistrationConfirmation } = await import('@/lib/email')

        let confirmFirstName = 'Participant'
        let confirmLastName = ''
        if (validatedData.participants && validatedData.participants.length > 0) {
          const first = validatedData.participants[0].customFields
          for (const [key, value] of Object.entries(first)) {
            const k = (key as string).toLowerCase()
            if (k.includes('first') && k.includes('name')) confirmFirstName = String(value ?? 'Participant')
            if (k.includes('last') && k.includes('name')) confirmLastName = String(value ?? '')
          }
        }

        // Build registration summary (HTML) for confirmation email – sve što je ispunio na obrascu
        const summaryParts: string[] = []
        if (validatedData.participants && validatedData.participants.length > 0) {
          validatedData.participants.forEach((p, i) => {
            const num = validatedData.participants!.length > 1 ? ` ${i + 1}` : ''
            summaryParts.push(`<p style="margin: 0 0 8px 0;"><strong>Participant${num}</strong></p>`)
            Object.entries(p.customFields || {}).forEach(([label, value]) => {
              if (value == null || value === '') return
              const v = String(value)
              summaryParts.push(`<p style="margin: 0 0 4px 0; padding-left: 12px;">${escapeHtml(label)}: ${escapeHtml(v)}</p>`)
            })
          })
        }
        if (validatedData.registration_fee_type) {
          const feeLabel = validatedData.registration_fee_type.replace(/^fee_type_/, 'Fee type: ')
          summaryParts.push(`<p style="margin: 10px 0 4px 0;"><strong>Registration fee</strong>: ${escapeHtml(feeLabel)}</p>`)
        }
        if (validatedData.payment_preference) {
          const payLabel = validatedData.payment_preference === 'pay_now_card' ? 'Credit/Debit card' : 'Bank transfer'
          summaryParts.push(`<p style="margin: 0 0 4px 0;"><strong>Payment</strong>: ${escapeHtml(payLabel)}</p>`)
        }
        if (validatedData.accommodation) {
          const acc = validatedData.accommodation
          let hotelName = ''
          if (acc.hotel_id && conference.settings?.hotel_options) {
            const opts = (conference.settings.hotel_options as { id: string; name?: string }[]) || []
            hotelName = opts.find((h) => h.id === acc.hotel_id)?.name || acc.hotel_id
          }
          summaryParts.push(
            '<p style="margin: 10px 0 4px 0;"><strong>Accommodation</strong></p>',
            hotelName ? `<p style="margin: 0 0 4px 0; padding-left: 12px;">Hotel: ${escapeHtml(hotelName)}</p>` : '',
            `<p style="margin: 0 0 4px 0; padding-left: 12px;">Check-in: ${escapeHtml(new Date(acc.arrival_date).toLocaleDateString())}</p>`,
            `<p style="margin: 0 0 4px 0; padding-left: 12px;">Check-out: ${escapeHtml(new Date(acc.departure_date).toLocaleDateString())}</p>`,
            `<p style="margin: 0 0 4px 0; padding-left: 12px;">Nights: ${acc.number_of_nights}</p>`
          )
        }
        if (validatedData.payer_type === 'company' && validatedData.company_details) {
          const c = validatedData.company_details
          summaryParts.push(
            '<p style="margin: 10px 0 4px 0;"><strong>Billing (company)</strong></p>',
            `<p style="margin: 0 0 4px 0; padding-left: 12px;">${escapeHtml(c.company_name)}</p>`,
            c.vat_number ? `<p style="margin: 0 0 4px 0; padding-left: 12px;">VAT: ${escapeHtml(c.vat_number)}</p>` : '',
            `<p style="margin: 0 0 4px 0; padding-left: 12px;">${escapeHtml([c.address, c.postal_code, c.city, c.country].filter(Boolean).join(', '))}</p>`
          )
        }
        const registrationSummary = summaryParts.filter(Boolean).join('')

        await sendRegistrationConfirmation(
          registration.id,
          primaryEmail,
          confirmFirstName,
          confirmLastName,
          undefined, // paymentUrl – nije generiran u ovom koraku; korisnik dobiva link kasnije ako treba plaćanje
          conference.email_settings,
          registrationSummary || undefined,
          validatedData.locale === 'hr' ? 'hr' : 'en'
        )
        log.info('Registration confirmation email sent to participant', {
          registrationId: registration.id,
          email: primaryEmail,
          action: 'confirmation_email',
        })
      } catch (emailError) {
        log.error('Failed to send registration confirmation email', emailError as Error, {
          registrationId: registration.id,
          email: primaryEmail,
          action: 'confirmation_email',
        })
        // Don't fail registration if confirmation email fails
      }
    }

    // Send notification to conference team (if reply_to email is configured)
    if (conference.email_settings?.reply_to) {
      try {
        const { sendConferenceTeamNotification } = await import('@/lib/email')
        
        // Extract participant info for notification
        let participantInfo = 'Guest Participant'
        if (validatedData.participants && validatedData.participants.length > 0) {
          const firstParticipant = validatedData.participants[0].customFields
          const firstName = Object.entries(firstParticipant).find(([key]) => 
            key.toLowerCase().includes('first') && key.toLowerCase().includes('name')
          )?.[1] || ''
          const lastName = Object.entries(firstParticipant).find(([key]) => 
            key.toLowerCase().includes('last') && key.toLowerCase().includes('name')
          )?.[1] || ''
          participantInfo = `${firstName} ${lastName}`.trim() || primaryEmail || 'Guest Participant'
        } else if (primaryEmail) {
          participantInfo = primaryEmail
        }

        // Get hotel name if accommodation is selected
        let hotelName = null
        if (validatedData.accommodation?.hotel_id && conference.settings?.hotel_options) {
          const hotelOptions = conference.settings.hotel_options as any[]
          const selectedHotel = hotelOptions.find((h: any) => h.id === validatedData.accommodation?.hotel_id)
          hotelName = selectedHotel?.name || null
        }

        await sendConferenceTeamNotification({
          to: conference.email_settings.reply_to,
          subject: `🎉 New Registration: ${conference.name}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .field { margin-bottom: 15px; }
                  .label { font-weight: bold; color: #4b5563; display: block; margin-bottom: 5px; }
                  .value { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
                  .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">🎉 New Registration</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone has registered for your conference</p>
                  </div>
                  <div class="content">
                    <div class="field">
                      <span class="label">Conference:</span>
                      <div class="value">${conference.name}</div>
                    </div>
                    <div class="field">
                      <span class="label">Participant:</span>
                      <div class="value">${participantInfo}</div>
                    </div>
                    <div class="field">
                      <span class="label">Registration ID:</span>
                      <div class="value">${registration.id}</div>
                    </div>
                    <div class="field">
                      <span class="label">Email:</span>
                      <div class="value">${primaryEmail || 'N/A'}</div>
                    </div>
                    <div class="field">
                      <span class="label">Participants Count:</span>
                      <div class="value">${validatedData.participants?.length || 1}</div>
                    </div>
                    ${validatedData.accommodation ? `
                    <div class="field">
                      <span class="label">Accommodation:</span>
                      <div class="value">
                        ${hotelName ? `<strong>${hotelName}</strong><br/>` : ''}
                        ${validatedData.accommodation?.arrival_date ? `Check-in: ${new Date(validatedData.accommodation.arrival_date).toLocaleDateString()}` : ''}
                        ${validatedData.accommodation?.departure_date ? ` | Check-out: ${new Date(validatedData.accommodation.departure_date).toLocaleDateString()}` : ''}
                        ${validatedData.accommodation?.number_of_nights ? ` | ${validatedData.accommodation.number_of_nights} nights` : ''}
                      </div>
                    </div>
                    ` : ''}
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/registrations" class="button">
                        View Registration →
                      </a>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
          text: `
New Registration

Conference: ${conference.name}
Participant: ${participantInfo}
Registration ID: ${registration.id}
Email: ${primaryEmail || 'N/A'}
Participants Count: ${validatedData.participants?.length || 1}
${validatedData.accommodation ? `
Accommodation:
${hotelName ? `Hotel: ${hotelName}` : ''}
${validatedData.accommodation?.arrival_date ? `Check-in: ${new Date(validatedData.accommodation.arrival_date).toLocaleDateString()}` : ''}
${validatedData.accommodation?.departure_date ? `Check-out: ${new Date(validatedData.accommodation.departure_date).toLocaleDateString()}` : ''}
${validatedData.accommodation?.number_of_nights ? `Nights: ${validatedData.accommodation.number_of_nights}` : ''}
` : ''}

View in admin panel: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/registrations
          `,
          conferenceName: conference.name,
        })
        log.info('Conference team notification sent for new registration', {
          registrationId: registration.id,
          conferenceId: validatedData.conference_id,
          notificationEmail: conference.email_settings.reply_to,
        })
      } catch (notificationError) {
        log.error('Failed to send conference team notification', notificationError instanceof Error ? notificationError : undefined, {
          registrationId: registration.id,
          conferenceId: validatedData.conference_id,
          action: 'team_notification',
        })
        // Don't fail registration if notification fails
      }
    }

    // Option A: when pay_now_card and amount > 0, return payment_required + amount/currency for same-page payment
    const isPayNowCard = validatedData.payment_preference === 'pay_now_card'
    let paymentPayload: {
      payment_required?: boolean
      amount?: number
      currency?: string
    } = {}
    if (isPayNowCard) {
      const { getRegistrationChargeAmount } = await import('@/utils/pricing')
      const { amount, currency } = getRegistrationChargeAmount(
        {
          registration_fee_type: validatedData.registration_fee_type || null,
        },
        {
          pricing: ((conference as { pricing?: ConferencePricing | null }).pricing) ?? null,
          start_date: (conference as { start_date?: string }).start_date ?? null,
        }
      )
      if (amount > 0) {
        paymentPayload = {
          payment_required: true,
          amount,
          currency: currency || 'EUR',
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration submitted successfully',
        registrationId: registration.id,
        ...paymentPayload,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
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

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Please try again later'
    log.error('Registration error', error instanceof Error ? error : undefined, {
      action: 'registration_error',
      errorMessage,
    })

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
