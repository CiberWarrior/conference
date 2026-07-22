import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/platform-settings
 * Returns the platform owner's payment settings (Super Admin only).
 */
export async function GET() {
  try {
    const { supabase } = await requireSuperAdmin()

    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) throw error

    return NextResponse.json({ settings: data })
  } catch (error) {
    return handleApiError(error, { action: 'get_platform_settings' })
  }
}

const updateSchema = z.object({
  bank_account_number: z.string().max(34).optional().nullable(),
  bank_account_holder: z.string().max(200).optional().nullable(),
  bank_name: z.string().max(200).optional().nullable(),
  swift_bic: z.string().max(20).optional().nullable(),
  bank_address: z.string().max(300).optional().nullable(),
  bank_currency: z.string().min(3).max(3).optional(),
  bank_transfer_enabled: z.boolean().optional(),
  payment_note: z.string().max(1000).optional().nullable(),
})

/**
 * PATCH /api/admin/platform-settings
 * Updates the platform owner's payment settings (Super Admin only).
 */
export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await requireSuperAdmin()

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('platform_settings')
      .update({ ...parsed.data, updated_by: user.id })
      .eq('id', 1)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ settings: data })
  } catch (error) {
    return handleApiError(error, { action: 'update_platform_settings' })
  }
}
