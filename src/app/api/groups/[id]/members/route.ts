import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Remove a member from a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const userId = searchParams.get('userId')

    if (!memberId || !userId) {
      return NextResponse.json(
        { error: 'Member ID and User ID are required' },
        { status: 400 }
      )
    }

    // Check if user has permission (group creator or removing themselves)
    const { data: group } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single()

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Get member info to check if removing themselves
    const { data: member } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('id', memberId)
      .single()

    const canRemove = group.created_by === userId || member?.user_id === userId

    if (!canRemove) {
      return NextResponse.json(
        { error: 'Not authorized to remove this member' },
        { status: 403 }
      )
    }

    // Remove the member
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      console.error('Error removing member:', error)
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Member removal error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 500 }
    )
  }
}