import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
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
    const supabase = await createServerClient()

    const { data: conference, error } = await supabase
      .from('conferences')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !conference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
    }

    // Return with no-cache headers to prevent caching issues
    return NextResponse.json(
      { conference },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Get conference error:', error)
    return NextResponse.json({ error: 'Failed to fetch conference' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/conferences/[id]
 * Update a conference
 * Uses admin client to bypass RLS policies
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use admin client to bypass RLS policies for updates
    const supabase = createAdminClient()
    const body: Partial<UpdateConferenceInput> = await request.json()

    // Remove id from body if present (we use params.id)
    delete body.id

    console.log('📝 Updating conference:', params.id)
    console.log('📝 Update data:', body)

    // Update conference
    const { data: conference, error } = await supabase
      .from('conferences')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Update conference error:', error)
      return NextResponse.json({ 
        error: 'Failed to update conference',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Conference updated successfully')

    // Return with no-cache headers to prevent caching issues
    return NextResponse.json(
      { conference },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('❌ Update conference error:', error)
    return NextResponse.json({ 
      error: 'Failed to update conference',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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
    const supabase = await createServerClient()

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

