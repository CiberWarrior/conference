import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

interface BulkUpdateRequest {
  action: 'update_status' | 'send_email' | 'export' | 'delete'
  registrationIds: string[]
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
    const { action, registrationIds, newStatus, emailType, emailData } = body

    if (!registrationIds || registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'No registrations selected' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // ✅ SECURITY: Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ SECURITY: Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      )
    }

    if (!profile.active) {
      return NextResponse.json(
        { error: 'Your account is deactivated' },
        { status: 403 }
      )
    }

    // Get all registrations
    const { data: registrations, error: fetchError } = await supabase
      .from('registrations')
      .select('*')
      .in('id', registrationIds)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      )
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json(
        { error: 'No registrations found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'update_status':
        if (!newStatus) {
          return NextResponse.json(
            { error: 'New status is required for update_status action' },
            { status: 400 }
          )
        }

        const { error: updateError } = await supabase
          .from('registrations')
          .update({ payment_status: newStatus })
          .in('id', registrationIds)

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update registrations' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `Successfully updated ${registrations.length} registration(s)`,
          updated: registrations.length,
        })

      case 'send_email':
        if (!emailType) {
          return NextResponse.json(
            { error: 'Email type is required for send_email action' },
            { status: 400 }
          )
        }

        // Send emails in batches to avoid rate limiting
        const batchSize = 10
        const results = {
          sent: 0,
          failed: 0,
          errors: [] as string[],
        }

        for (let i = 0; i < registrations.length; i += batchSize) {
          const batch = registrations.slice(i, i + batchSize)

          await Promise.all(
            batch.map(async (reg) => {
              try {
                await sendEmail({
                  emailType,
                  registrationId: reg.id,
                  email: reg.email,
                  firstName: reg.first_name,
                  lastName: reg.last_name,
                  paymentUrl: emailData?.paymentUrl || reg.stripe_session_id
                    ? `${process.env.NEXT_PUBLIC_APP_URL}/payment?session=${reg.stripe_session_id}`
                    : undefined,
                  invoiceUrl: reg.invoice_url || undefined,
                  conferenceDate: emailData?.conferenceDate,
                  conferenceLocation: emailData?.conferenceLocation,
                  conferenceProgram: emailData?.conferenceProgram,
                  customMessage: emailData?.customMessage,
                })
                results.sent++
              } catch (error) {
                results.failed++
                results.errors.push(
                  `Failed to send email to ${reg.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
              }
            })
          )

          // Small delay between batches to avoid rate limiting
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

      case 'delete':
        // Use admin client to delete (bypasses RLS)
        const adminSupabase = createAdminClient()
        
        // Delete registrations
        const { error: deleteError } = await adminSupabase
          .from('registrations')
          .delete()
          .in('id', registrationIds)

        if (deleteError) {
          console.error('Delete error:', deleteError)
          return NextResponse.json(
            { error: `Failed to delete registrations: ${deleteError.message}` },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `Successfully deleted ${registrations.length} registration(s)`,
          deleted: registrations.length,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    )
  }
}

