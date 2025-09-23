import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { name, description, members, userId } = await request.json()

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Group name and user ID are required' },
        { status: 400 }
      )
    }

    // First, ensure the user exists in the public.users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingUser) {
      // Get user info from auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)

      if (authError || !authUser.user) {
        return NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        )
      }

      // Create user record in public.users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email || '',
          full_name: authUser.user.user_metadata?.full_name || null,
          avatar_url: authUser.user.user_metadata?.avatar_url || null
        })

      if (userError) {
        console.error('Error creating user record:', userError)
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        )
      }
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: userId
      })
      .select()
      .single()

    if (groupError) {
      console.error('Error creating group:', groupError)
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      )
    }

    // Add the creator as a member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        nickname: 'You'
      })

    if (memberError) {
      console.error('Error adding creator as member:', memberError)
    }

    // Add other members as placeholder entries (they can join later)
    if (members && members.length > 0) {
      const memberInserts = members
        .filter((member: string) => member.trim())
        .map((member: string) => ({
          group_id: group.id,
          user_id: null, // Placeholder members have null user_id
          nickname: member.trim()
        }))

      if (memberInserts.length > 0) {
        const { error: membersError } = await supabase
          .from('group_members')
          .insert(memberInserts)

        if (membersError) {
          console.error('Error adding placeholder members:', membersError)
        } else {
          console.log(`Added ${memberInserts.length} placeholder members to group`)
        }
      }
    }

    return NextResponse.json(group)
  } catch (error: unknown) {
    console.error('Group creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create group' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get groups where user is a member
    const { data: userGroups, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)

    if (memberError) {
      console.error('Error fetching user groups:', memberError)
      return NextResponse.json(
        { error: 'Failed to fetch user groups' },
        { status: 500 }
      )
    }

    if (!userGroups || userGroups.length === 0) {
      return NextResponse.json([])
    }

    const groupIds = userGroups.map(ug => ug.group_id)

    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching groups:', error)
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      )
    }

    return NextResponse.json(groups || [])
  } catch (error: unknown) {
    console.error('Groups fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}