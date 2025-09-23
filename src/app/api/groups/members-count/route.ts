import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupIds = searchParams.get('groupIds')

    if (!groupIds) {
      return NextResponse.json({})
    }

    const ids = groupIds.split(',')

    // Get member counts for each group
    const { data: memberCounts, error } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', ids)

    if (error) {
      console.error('Error fetching member counts:', error)
      return NextResponse.json({})
    }

    // Count members per group
    const counts: Record<string, number> = {}
    memberCounts?.forEach(member => {
      counts[member.group_id] = (counts[member.group_id] || 0) + 1
    })

    return NextResponse.json(counts)
  } catch (error: unknown) {
    console.error('Member count fetch error:', error)
    return NextResponse.json({})
  }
}