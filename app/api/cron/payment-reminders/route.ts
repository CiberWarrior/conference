import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendPaymentReminder } from '@/lib/email'
import { extractRegistrationContact } from '@/lib/registration-contact'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/payment-reminders
 * Vercel Cron: sends payment reminders across conferences.
 * Auth: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const daysSinceRegistration = 3
  const maxReminders = 3
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'

  const supabase = createAdminClient()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceRegistration)

  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(
      `
      *,
      conference:conferences (
        id,
        slug,
        email_settings,
        active,
        published
      )
    `
    )
    .eq('payment_status', 'pending')
    .lte('created_at', cutoffDate.toISOString())
    .lt('payment_reminder_count', maxReminders)
    .or(
      `last_payment_reminder_sent_at.is.null,last_payment_reminder_sent_at.lt.${cutoffDate.toISOString()}`
    )
    .limit(200)

  if (error) {
    log.error('Cron payment reminders query failed', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const reg of registrations || []) {
    const conference = reg.conference as {
      slug?: string
      email_settings?: any
      active?: boolean
    } | null
    if (!conference?.active && conference?.active !== undefined) {
      skipped++
      continue
    }

    const contact = extractRegistrationContact(reg)
    if (!contact.email) {
      skipped++
      continue
    }

    if (dryRun) {
      sent++
      continue
    }

    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const paymentUrl = conference?.slug
        ? `${base}/conferences/${conference.slug}/register`
        : undefined

      await sendPaymentReminder(
        reg.id,
        contact.email,
        contact.firstName || 'Participant',
        contact.lastName || '',
        paymentUrl,
        undefined,
        conference?.email_settings
      )

      await supabase
        .from('registrations')
        .update({
          last_payment_reminder_sent_at: new Date().toISOString(),
          payment_reminder_count: (reg.payment_reminder_count || 0) + 1,
        })
        .eq('id', reg.id)

      sent++
    } catch (e: any) {
      errors.push(`${reg.id}: ${e?.message || 'send failed'}`)
    }
  }

  return NextResponse.json({
    success: true,
    dryRun,
    candidates: registrations?.length || 0,
    sent,
    skipped,
    errors,
  })
}
