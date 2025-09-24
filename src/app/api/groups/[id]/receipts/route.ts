import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Get receipts for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params

    console.log('Fetching receipts for group:', groupId)

    // For now, return empty array since tables might not exist yet
    // TODO: Implement proper receipt fetching once database schema is ready
    return NextResponse.json([])
  } catch (error: unknown) {
    console.error('Receipts fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch receipts' },
      { status: 500 }
    )
  }
}