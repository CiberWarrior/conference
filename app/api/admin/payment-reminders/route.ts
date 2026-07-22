import { NextRequest, NextResponse } from 'next/server'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'
import { sendPaymentReminder } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * Extract contact details from a registration. New registrations store data in
 * `participants[0].customFields` / `custom_data`; the legacy first_name/last_name
 * columns are null, so fall back across all of them.
 */
function extractContact(reg: Record<string, any>): {
  email: string
  firstName: string
  lastName: string
} {
  const customData = reg.custom_data || {}
  const firstParticipant =
    Array.isArray(reg.participants) && reg.participants.length > 0
      ? reg.participants[0]?.customFields ?? {}
      : {}

  const pick = (keys: string[]): string => {
    for (const source of [reg, customData, firstParticipant]) {
      for (const key of keys) {
        const value = source?.[key]
        if (value != null && String(value).trim()) return String(value).trim()
      }
    }
    return ''
  }

  return {
    email: pick(['email', 'Email', 'E-mail', 'e_mail', 'EMAIL']),
    firstName: pick(['first_name', 'firstName', 'First Name', 'ime', 'Ime']),
    lastName: pick(['last_name', 'lastName', 'Last Name', 'prezime', 'Prezime', 'surname']),
  }
}

/**
 * POST /api/admin/payment-reminders
 * Send payment reminders to unpaid registrations
 * 
 * Query params:
 * - daysSinceRegistration: Number of days since registration to send reminder (default: 3)
 * - maxReminders: Maximum number of reminders to send per registration (default: 3)
 * - dryRun: If true, only returns what would be sent without actually sending (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const conferenceId = searchParams.get('conference_id')

    if (!conferenceId) {
      throw ApiError.validationError('Conference ID is required')
    }

    // ✅ Scope to a single conference (matches refunds / payment-history routes)
    const { supabase } = await requireConferencePermission(conferenceId, 'can_manage_payments')

    const daysSinceRegistration = parseInt(searchParams.get('daysSinceRegistration') || '3')
    const maxReminders = parseInt(searchParams.get('maxReminders') || '3')
    const dryRun = searchParams.get('dryRun') === 'true'

    // Find registrations that need reminders
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceRegistration)

    const { data: registrations, error } = await supabase
      .from('registrations')
      .select(`
        *,
        conference:conferences (
          email_settings,
          slug
        )
      `)
      .eq('conference_id', conferenceId)
      .eq('payment_status', 'pending')
      .lte('created_at', cutoffDate.toISOString())
      .or(`last_payment_reminder_sent_at.is.null,last_payment_reminder_sent_at.lt.${cutoffDate.toISOString()}`)
      .lt('payment_reminder_count', maxReminders)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      )
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No registrations need reminders',
        sent: 0,
        skipped: 0,
      })
    }

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Generate payment URLs for each registration
    for (const reg of registrations) {
      try {
        // Skip if already sent reminder recently
        if (reg.last_payment_reminder_sent_at) {
          const lastSent = new Date(reg.last_payment_reminder_sent_at)
          const daysSinceLastReminder = Math.floor(
            (Date.now() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSinceLastReminder < daysSinceRegistration) {
            results.skipped++
            continue
          }
        }

        if (dryRun) {
          results.sent++
          continue
        }

        // Contact details live in participants/custom_data in the current model;
        // the legacy first_name/last_name columns are null for new registrations.
        const contact = extractContact(reg)
        if (!contact.email) {
          results.skipped++
          continue
        }

        // Link back to the public conference page (the old /payment/[id] route
        // does not exist). Bank transfer instructions were already emailed at signup.
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const slug = (reg as any).conference?.slug
        const paymentUrl = slug ? `${baseUrl}/conferences/${slug}` : undefined

        // Get email settings from conference (if available)
        const emailSettings = (reg as any).conference?.email_settings || undefined

        // Send reminder email
        await sendPaymentReminder(
          reg.id,
          contact.email,
          contact.firstName,
          contact.lastName,
          paymentUrl,
          `This is reminder ${(reg.payment_reminder_count || 0) + 1} of ${maxReminders}. Please complete your payment to secure your spot.`,
          emailSettings
        )

        // Update registration with reminder info
        await supabase
          .from('registrations')
          .update({
            last_payment_reminder_sent_at: new Date().toISOString(),
            payment_reminder_count: (reg.payment_reminder_count || 0) + 1,
          })
          .eq('id', reg.id)

        results.sent++
      } catch (error) {
        results.failed++
        results.errors.push(
          `Failed to send reminder to ${extractContact(reg).email || reg.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Would send ${results.sent} reminders (dry run)`
        : `Sent ${results.sent} reminders, ${results.failed} failed, ${results.skipped} skipped`,
      ...results,
    })
  } catch (error) {
    return handleApiError(error, { action: 'payment_reminders' })
  }
}

/**
 * GET /api/admin/payment-reminders
 * Get statistics about payment reminders
 */
export async function GET(request: NextRequest) {
  try {
    const conferenceId = request.nextUrl.searchParams.get('conference_id')

    if (!conferenceId) {
      throw ApiError.validationError('Conference ID is required')
    }

    // ✅ Scope to a single conference (matches refunds / payment-history routes)
    const { supabase } = await requireConferencePermission(conferenceId, 'can_manage_payments')

    // Pending payments are the reliable signal in the current data model
    // (payment_status is set for both card and bank transfer with a non-free fee).
    const { data: stats, error } = await supabase
      .from('registrations')
      .select('payment_status, payment_reminder_count, last_payment_reminder_sent_at')
      .eq('conference_id', conferenceId)
      .eq('payment_status', 'pending')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      )
    }

    const pending = stats?.filter((s) => s.payment_status === 'pending') || []
    const withReminders = pending.filter((s) => (s.payment_reminder_count || 0) > 0)

    return NextResponse.json({
      totalPending: pending.length,
      withReminders: withReminders.length,
      averageReminders: withReminders.length > 0
        ? withReminders.reduce((sum, s) => sum + (s.payment_reminder_count || 0), 0) / withReminders.length
        : 0,
    })
  } catch (error) {
    return handleApiError(error, { action: 'get_payment_reminders_stats' })
  }
}

