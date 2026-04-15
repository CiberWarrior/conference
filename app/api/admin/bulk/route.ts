import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { log } from '@/lib/logger'
import { requireConferencePermission } from '@/lib/api-auth'
import { handleApiError, ApiError } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

interface BulkUpdateRequest {
  action: 'update_status' | 'send_email' | 'export' | 'delete'
  registrationIds: string[]
  conferenceId: string // required so we can verify permissions
  newStatus?: 'paid' | 'pending' | 'not_required'
  emailType?: 'payment_reminder' | 'pre_conference_reminder' | 'event_details'
  emailData?: {
    paymentUrl?: string
    conferenceDate?: string
    conferenceLocation?: string
    conferenceProgram?: string
    customMessage?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkUpdateRequest = await request.json()
    const { action, registrationIds, conferenceId, newStatus, emailType, emailData } = body

    if (!registrationIds || registrationIds.length === 0) {
      throw ApiError.validationError('No registrations selected')
    }

    if (!conferenceId) {
      throw ApiError.validationError('Conference ID is required for bulk operations')
    }

    // Determine required permission based on action
    const requiredPermission =
      action === 'delete'
        ? ('can_delete_data' as const)
        : action === 'update_status'
          ? ('can_manage_payments' as const)
          : ('can_view_registrations' as const)

    const { supabase } = await requireConferencePermission(conferenceId, requiredPermission)

    // Fetch only registrations that belong to the specified conference — prevents cross-conference IDOR
    const { data: registrations, error: fetchError } = await supabase
      .from('registrations')
      .select(
        `
        *,
        conference:conferences (
          email_settings
        )
      `,
      )
      .in('id', registrationIds)
      .eq('conference_id', conferenceId)

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ error: 'No registrations found' }, { status: 404 })
    }

    switch (action) {
      case 'update_status': {
        if (!newStatus) {
          return NextResponse.json(
            { error: 'New status is required for update_status action' },
            { status: 400 },
          )
        }

        const { error: updateError } = await supabase
          .from('registrations')
          .update({ payment_status: newStatus })
          .in('id', registrationIds)
          .eq('conference_id', conferenceId)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update registrations' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: `Successfully updated ${registrations.length} registration(s)`,
          updated: registrations.length,
        })
      }

      case 'send_email': {
        if (!emailType) {
          return NextResponse.json(
            { error: 'Email type is required for send_email action' },
            { status: 400 },
          )
        }

        const batchSize = 10
        const results = { sent: 0, failed: 0, errors: [] as string[] }

        for (let i = 0; i < registrations.length; i += batchSize) {
          const batch = registrations.slice(i, i + batchSize)

          await Promise.all(
            batch.map(async (reg) => {
              try {
                const emailSettings = (reg as any).conference?.email_settings || undefined

                await sendEmail({
                  emailType,
                  registrationId: reg.id,
                  email: reg.email,
                  firstName: reg.first_name,
                  lastName: reg.last_name,
                  paymentUrl:
                    emailData?.paymentUrl ||
                    (reg.stripe_session_id
                      ? `${process.env.NEXT_PUBLIC_APP_URL}/payment?session=${reg.stripe_session_id}`
                      : undefined),
                  invoiceUrl: reg.invoice_url || undefined,
                  conferenceDate: emailData?.conferenceDate,
                  conferenceLocation: emailData?.conferenceLocation,
                  conferenceProgram: emailData?.conferenceProgram,
                  customMessage: emailData?.customMessage,
                  emailSettings,
                })
                results.sent++
              } catch (error) {
                results.failed++
                results.errors.push(
                  `Failed to send email to ${reg.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                )
              }
            }),
          )

          if (i + batchSize < registrations.length) {
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
        }

        return NextResponse.json({
          success: true,
          message: `Sent ${results.sent} email(s), ${results.failed} failed`,
          sent: results.sent,
          failed: results.failed,
          errors: results.errors,
        })
      }

      case 'delete': {
        // Only delete IDs that were confirmed to belong to this conference (fetched above)
        const confirmedIds = registrations.map((r) => r.id)
        const adminSupabase = createAdminClient()

        const { error: deleteError } = await adminSupabase
          .from('registrations')
          .delete()
          .in('id', confirmedIds)
          .eq('conference_id', conferenceId)

        if (deleteError) {
          log.error(
            'Failed to delete registrations in bulk operation',
            deleteError instanceof Error ? deleteError : undefined,
            {
              conferenceId,
              count: confirmedIds.length,
              action: 'bulk_delete',
            },
          )
          return NextResponse.json(
            { error: `Failed to delete registrations: ${deleteError.message}` },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          message: `Successfully deleted ${registrations.length} registration(s)`,
          deleted: registrations.length,
        })
      }

      default:
        throw ApiError.validationError('Invalid action')
    }
  } catch (error) {
    return handleApiError(error, { action: 'bulk_operation' })
  }
}

