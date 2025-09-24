import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Create a new receipt with item assignments
export async function POST(request: NextRequest) {
  try {
    const {
      groupId,
      storeName,
      items,
      assignments,
      total
    } = await request.json()

    console.log('Creating receipt:', { groupId, storeName, items: items.length, total })

    // Create the receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        group_id: groupId,
        store_name: storeName || 'Unknown Store',
        total_amount: total,
        receipt_date: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (receiptError) {
      console.error('Error creating receipt:', receiptError)
      return NextResponse.json(
        { error: 'Failed to create receipt' },
        { status: 500 }
      )
    }

    console.log('Created receipt:', receipt)

    // Create receipt items and assignments
    const receiptItems = []

    for (const item of items) {
      const assignment = assignments[item.id]

      // Create receipt item
      const { data: receiptItem, error: itemError } = await supabase
        .from('receipt_items')
        .insert({
          receipt_id: receipt.id,
          name: item.name,
          price: item.price,
          quantity: 1
        })
        .select()
        .single()

      if (itemError) {
        console.error('Error creating receipt item:', itemError)
        continue
      }

      receiptItems.push(receiptItem)

      // Create assignment based on type
      if (assignment) {
        if (assignment.type === 'self' || assignment.type === 'member') {
          const assignedMemberId = assignment.type === 'self'
            ? null // Will need to get current user's member ID
            : assignment.assignedTo

          const { error: assignmentError } = await supabase
            .from('item_assignments')
            .insert({
              receipt_item_id: receiptItem.id,
              assigned_to_member_id: assignedMemberId,
              amount: item.price,
              assignment_type: assignment.type
            })

          if (assignmentError) {
            console.error('Error creating assignment:', assignmentError)
          }
        } else if (assignment.type === 'split') {
          // Get all group members
          const { data: members } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupId)

          if (members) {
            const splitAmount = item.price / members.length

            for (const member of members) {
              const { error: assignmentError } = await supabase
                .from('item_assignments')
                .insert({
                  receipt_item_id: receiptItem.id,
                  assigned_to_member_id: member.id,
                  amount: splitAmount,
                  assignment_type: 'split'
                })

              if (assignmentError) {
                console.error('Error creating split assignment:', assignmentError)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      receipt,
      itemsCreated: receiptItems.length
    })
  } catch (error: unknown) {
    console.error('Receipt creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create receipt' },
      { status: 500 }
    )
  }
}