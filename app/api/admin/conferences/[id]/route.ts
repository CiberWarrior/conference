import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { UpdateConferenceInput } from '@/types/conference'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/conferences/[id]
 * Get a single conference by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    const { data: conference, error } = await supabase
      .from('conferences')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !conference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    return NextResponse.json({ conference })
  } catch (error) {
    console.error('Get conference error:', error)
    return NextResponse.json({ error: 'Failed to fetch conference' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/conferences/[id]
 * Update a conference
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const body: Partial<UpdateConferenceInput> = await request.json()

    // Remove id from body if present (we use params.id)
    delete body.id

    // Update conference
    const { data: conference, error } = await supabase
      .from('conferences')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Update conference error:', error)
      return NextResponse.json({ error: 'Failed to update conference' }, { status: 500 })
    }

    return NextResponse.json({ conference })
  } catch (error) {
    console.error('Update conference error:', error)
    return NextResponse.json({ error: 'Failed to update conference' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/conferences/[id]
 * Delete a conference
 * WARNING: This will cascade delete all related data (registrations, abstracts, etc.)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Check if conference exists
    const { data: conference, error: fetchError } = await supabase
      .from('conferences')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (fetchError || !conference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    // Delete conference (will cascade delete all related data)
    const { error: deleteError } = await supabase
      .from('conferences')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Delete conference error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete conference' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Conference "${conference.name}" and all related data deleted successfully`,
    })
  } catch (error) {
    console.error('Delete conference error:', error)
    return NextResponse.json({ error: 'Failed to delete conference' }, { status: 500 })
  }
}

