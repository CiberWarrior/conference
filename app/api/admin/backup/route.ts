import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'
import { log } from '@/lib/logger'

/**
 * API endpoint za kreiranje backupa svih registracija
 * 
 * Usage:
 * GET /api/admin/backup?format=csv
 * GET /api/admin/backup?format=json
 * 
 * Security: ✅ Super Admin only
 */

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ✅ Use centralized auth helper (Super Admin only)
    const { supabase } = await requireSuperAdmin()

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json' // csv ili json

    // Dohvati sve registracije
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
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

    // Formatiraj podatke
    if (format === 'csv') {
      const headers = [
        'ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Country',
        'Institution',
        'Arrival Date',
        'Departure Date',
        'Payment Required',
        'Payment By Card',
        'Payment Status',
        'Stripe Session ID',
        'Payment Intent ID',
        'Invoice ID',
        'Invoice URL',
        'Created At',
      ]

      const rows = registrations.map((r) => [
        r.id,
        r.first_name || '',
        r.last_name || '',
        r.email || '',
        r.phone || '',
        r.country || '',
        r.institution || '',
        r.arrival_date || '',
        r.departure_date || '',
        r.payment_required ? 'Yes' : 'No',
        r.payment_by_card ? 'Yes' : 'No',
        r.payment_status || '',
        r.stripe_session_id || '',
        r.payment_intent_id || '',
        r.invoice_id || '',
        r.invoice_url || '',
        r.created_at || '',
      ])

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="registrations-backup-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      // JSON format
      return NextResponse.json(
        {
          exported_at: new Date().toISOString(),
          total_records: registrations.length,
          data: registrations,
        },
        {
          headers: {
            'Content-Disposition': `attachment; filename="registrations-backup-${new Date().toISOString().split('T')[0]}.json"`,
          },
        }
      )
    }
  } catch (error) {
    return handleApiError(error, { action: 'admin_backup' })
  }
}

