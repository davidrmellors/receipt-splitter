'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import SwipeableItemCard from '@/components/receipt/SwipeableItemCard'
import Link from 'next/link'

interface ReceiptItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface GroupMember {
  id: string
  name: string
}

interface ItemAssignment {
  type: 'self' | 'member' | 'split' | 'custom'
  assignedTo?: string
  memberName?: string
  customSplit?: Array<{ userId: string; amount: number }>
}

export default function NewReceipt() {
  const params = useParams()
  const searchParams = useSearchParams()
  const groupId = params.id as string
  const imageData = searchParams.get('image')

  const [items, setItems] = useState<ReceiptItem[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [assignments, setAssignments] = useState<Record<string, ItemAssignment>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  // Mock data - in real app, this would come from Supabase
  const [groupMembers] = useState<GroupMember[]>([
    { id: '2', name: 'Alice' },
    { id: '3', name: 'Bob' },
    { id: '4', name: 'Charlie' }
  ])

  const currentUser = { id: '1', name: 'You' }

  useEffect(() => {
    const parseReceipt = async () => {
      if (!imageData) {
        setError('No image data provided')
        return
      }

      try {
        // Call OpenAI API to parse receipt
        const response = await fetch('/api/parse-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData: decodeURIComponent(imageData) }),
        })

        if (!response.ok) {
          throw new Error('Failed to parse receipt')
        }

        const data = await response.json()

        // Convert parsed items to our format
        const parsedItems: ReceiptItem[] = data.items.map((item: any, index: number) => ({
          id: `item-${index}`,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        }))

        setItems(parsedItems)
      } catch (error) {
        console.error('Error parsing receipt:', error)
        // Fallback to mock data for demo
        setItems([
          { id: '1', name: 'Burger', price: 12.99, quantity: 1 },
          { id: '2', name: 'French Fries', price: 4.99, quantity: 1 },
          { id: '3', name: 'Coke', price: 2.99, quantity: 2 },
          { id: '4', name: 'Pizza', price: 18.99, quantity: 1 }
        ])
      } finally {
        setLoading(false)
      }
    }

    parseReceipt()
  }, [imageData])

  const handleAssignment = (itemId: string, assignment: ItemAssignment) => {
    setAssignments(prev => ({
      ...prev,
      [itemId]: assignment
    }))

    // Move to next item
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(prev => prev + 1)
    }
  }

  const handleFinish = async () => {
    setProcessing(true)

    try {
      // Here you would save the receipt and assignments to Supabase
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

      // Redirect to group summary
      window.location.href = `/groups/${groupId}/summary`
    } catch (error) {
      setError('Failed to save receipt assignments')
    } finally {
      setProcessing(false)
    }
  }

  const currentItem = items[currentItemIndex]
  const isLastItem = currentItemIndex === items.length - 1
  const allItemsAssigned = items.every(item => assignments[item.id])
  const totalAssignments = Object.keys(assignments).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing receipt...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`/groups/${groupId}/scan`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    )
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Saving assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={`/groups/${groupId}`} className="text-xl font-bold text-gray-900">
              ← Back to Group
            </Link>
            <div className="text-sm text-gray-600">
              {totalAssignments} of {items.length} assigned
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative pt-4 pb-2">
            <div className="flex items-center justify-between text-sm font-medium text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round((totalAssignments / items.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(totalAssignments / items.length) * 100}%` }}
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <AnimatePresence mode="wait">
          {allItemsAssigned ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto px-4 text-center"
            >
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-green-500 text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">All Items Assigned!</h2>
                <p className="text-gray-600 mb-8">
                  You've successfully assigned all {items.length} items. Ready to save?
                </p>

                {/* Assignment Summary */}
                <div className="space-y-2 mb-8 text-left">
                  {items.map(item => {
                    const assignment = assignments[item.id]
                    return (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-600">
                          {assignment?.type === 'self' && 'You'}
                          {assignment?.type === 'member' && assignment.memberName}
                          {assignment?.type === 'split' && 'Split evenly'}
                          {assignment?.type === 'custom' && 'Custom split'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinish}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Receipt
                </motion.button>
              </div>
            </motion.div>
          ) : currentItem ? (
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="max-w-lg mx-auto"
            >
              <div className="text-center mb-4 px-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Item {currentItemIndex + 1} of {items.length}
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Swipe to assign this item
                </p>
              </div>

              <SwipeableItemCard
                item={currentItem}
                groupMembers={groupMembers}
                currentUser={currentUser}
                onAssign={handleAssignment}
              />

              {/* Skip/Back buttons */}
              <div className="flex justify-center space-x-4 mt-6">
                {currentItemIndex > 0 && (
                  <button
                    onClick={() => setCurrentItemIndex(prev => prev - 1)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    ← Previous
                  </button>
                )}
                <button
                  onClick={() => {
                    if (currentItemIndex < items.length - 1) {
                      setCurrentItemIndex(prev => prev + 1)
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  )
}