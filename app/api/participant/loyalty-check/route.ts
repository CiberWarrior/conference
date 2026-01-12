import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyDiscountInfo, checkLoyaltyDiscount } from '@/lib/loyalty'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const loyaltyCheckSchema = z.object({
  email: z.string().email('Invalid email address'),
  conference_id: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
})

/**
 * POST /api/participant/loyalty-check
 * Check loyalty discount eligibility
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loyaltyCheckSchema.parse(body)

    // If conference_id and amount provided, calculate specific discount
    if (validatedData.conference_id && validatedData.amount) {
      const discountResult = await checkLoyaltyDiscount(
        validatedData.email,
        validatedData.conference_id,
        validatedData.amount
      )

      return NextResponse.json({
        success: true,
        discount: discountResult,
      })
    }

    // Otherwise, just return general loyalty info
    const loyaltyInfo = await getLoyaltyDiscountInfo(validatedData.email)

    if (!loyaltyInfo) {
      return NextResponse.json({
        success: true,
        discount: null,
        message: 'No loyalty benefits available',
      })
    }

    return NextResponse.json({
      success: true,
      discount: loyaltyInfo,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    log.error('Loyalty check error', error as Error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
