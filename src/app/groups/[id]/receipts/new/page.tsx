'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import SwipeableItemCard from '@/components/receipt/SwipeableItemCard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, ArrowRight, ArrowLeftIcon, Loader2, AlertTriangle, Save } from 'lucide-react'

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing receipt...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="mb-2">Error</CardTitle>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href={`/groups/${groupId}/scan`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Saving assignments...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild className="text-xl font-bold p-0">
              <Link href={`/groups/${groupId}`}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Group
              </Link>
            </Button>
            <Badge variant="secondary">
              {totalAssignments} of {items.length} assigned
            </Badge>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-card/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative pt-4 pb-2">
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round((totalAssignments / items.length) * 100)}%</span>
            </div>
            <Progress
              value={(totalAssignments / items.length) * 100}
              className="h-2"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {allItemsAssigned ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto px-4"
            >
              <Card className="shadow-lg">
                <CardContent className="text-center p-6 sm:p-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <CardTitle className="text-2xl mb-4">All Items Assigned!</CardTitle>
                  <p className="text-muted-foreground mb-8">
                    You&apos;ve successfully assigned all {items.length} items. Ready to save?
                  </p>

                  {/* Assignment Summary */}
                  <div className="space-y-2 mb-8 text-left">
                    {items.map(item => {
                      const assignment = assignments[item.id]
                      return (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline">
                            {assignment?.type === 'self' && 'You'}
                            {assignment?.type === 'member' && assignment.memberName}
                            {assignment?.type === 'split' && 'Split evenly'}
                            {assignment?.type === 'custom' && 'Custom split'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleFinish}
                      size="lg"
                      className="px-8"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Receipt
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
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
                <h2 className="text-lg font-semibold">
                  Item {currentItemIndex + 1} of {items.length}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
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
              <div className="flex justify-center gap-4 mt-6 px-4">
                {currentItemIndex > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentItemIndex(prev => prev - 1)}
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentItemIndex < items.length - 1) {
                      setCurrentItemIndex(prev => prev + 1)
                    }
                  }}
                  disabled={currentItemIndex >= items.length - 1}
                >
                  Skip for now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  )
}