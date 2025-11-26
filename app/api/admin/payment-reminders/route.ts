import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendPaymentReminder } from '@/lib/email'

export const dynamic = 'force-dynamic'

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
    const daysSinceRegistration = parseInt(searchParams.get('daysSinceRegistration') || '3')
    const maxReminders = parseInt(searchParams.get('maxReminders') || '3')
    const dryRun = searchParams.get('dryRun') === 'true'

    const supabase = createServerClient()

    // Find registrations that need reminders
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceRegistration)

    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('payment_status', 'pending')
      .eq('payment_required', true)
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

        // Generate payment URL (you may need to adjust this based on your payment flow)
        const paymentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/${reg.id}`

        // Send reminder email
        await sendPaymentReminder(
          reg.id,
          reg.email,
          reg.first_name,
          reg.last_name,
          paymentUrl,
          `This is reminder ${(reg.payment_reminder_count || 0) + 1} of ${maxReminders}. Please complete your payment to secure your spot.`
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
          `Failed to send reminder to ${reg.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    console.error('Payment reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment reminders' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/payment-reminders
 * Get statistics about payment reminders
 */
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: stats, error } = await supabase
      .from('registrations')
      .select('payment_status, payment_reminder_count, last_payment_reminder_sent_at')
      .eq('payment_required', true)

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
    console.error('Get payment reminders stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}

