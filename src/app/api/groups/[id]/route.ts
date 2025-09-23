import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Delete a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user is the group creator
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

    if (group.created_by !== userId) {
      return NextResponse.json(
        { error: 'Only the group creator can delete the group' },
        { status: 403 }
      )
    }

    // Delete the group (cascade will delete related records)
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      console.error('Error deleting group:', error)
      return NextResponse.json(
        { error: 'Failed to delete group' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Group deletion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete group' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Get group members - simplified query
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('id, nickname, joined_at, user_id')
      .eq('group_id', groupId)

    if (membersError) {
      console.error('Error fetching members:', membersError)
    } else {
      console.log(`Found ${members?.length || 0} members for group ${groupId}:`, members)
    }

    // Get receipts for this group (empty for now)
    const receipts: any[] = []

    return NextResponse.json({
      group: {
        ...group,
        member_count: members?.length || 1
      },
      members: members || [],
      receipts
    })
  } catch (error: unknown) {
    console.error('Group fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch group' },
      { status: 500 }
    )
  }
}