import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { CreateConferenceInput } from '@/types/conference'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/conferences
 * Get all conferences for the current admin
 */
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: conferences, error } = await supabase
      .from('conferences')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get conferences error:', error)
      return NextResponse.json({ error: 'Failed to fetch conferences' }, { status: 500 })
    }

    return NextResponse.json({ conferences })
  } catch (error) {
    console.error('Get conferences error:', error)
    return NextResponse.json({ error: 'Failed to fetch conferences' }, { status: 500 })
  }
}

/**
 * POST /api/admin/conferences
 * Create a new conference
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body: CreateConferenceInput = await request.json()

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Conference name is required' }, { status: 400 })
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('conferences')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      // Add random suffix to make it unique
      const randomSuffix = Math.random().toString(36).substring(2, 6)
      const uniqueSlug = `${slug}-${randomSuffix}`
      
      const { data: conference, error } = await supabase
        .from('conferences')
        .insert({
          name: body.name,
          slug: uniqueSlug,
          description: body.description,
          start_date: body.start_date,
          end_date: body.end_date,
          location: body.location,
          venue: body.venue,
          website_url: body.website_url,
          pricing: body.pricing || undefined,
          settings: body.settings || undefined,
          owner_id: 'admin', // For now, all conferences owned by single admin
        })
        .select()
        .single()

      if (error) {
        console.error('Create conference error:', error)
        return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 })
      }

      return NextResponse.json({ conference }, { status: 201 })
    }

    // Create conference with generated slug
    const { data: conference, error } = await supabase
      .from('conferences')
      .insert({
        name: body.name,
        slug,
        description: body.description,
        start_date: body.start_date,
        end_date: body.end_date,
        location: body.location,
        venue: body.venue,
        website_url: body.website_url,
        pricing: body.pricing || undefined,
        settings: body.settings || undefined,
        owner_id: 'admin', // For now, all conferences owned by single admin
      })
      .select()
      .single()

    if (error) {
      console.error('Create conference error:', error)
      return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 })
    }

    return NextResponse.json({ conference }, { status: 201 })
  } catch (error) {
    console.error('Create conference error:', error)
    return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 })
  }
}

