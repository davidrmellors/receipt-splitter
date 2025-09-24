'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import SwipeableItemCard from '@/components/receipt/SwipeableItemCard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, ArrowRight, ArrowLeftIcon, Loader2, AlertTriangle, Save, Edit, Plus, Trash2 } from 'lucide-react'

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
  const imageId = searchParams.get('imageId')
  const legacyImageData = searchParams.get('image') // For backward compatibility

  const [items, setItems] = useState<ReceiptItem[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [assignments, setAssignments] = useState<Record<string, ItemAssignment>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [currentUser, setCurrentUser] = useState<GroupMember | null>(null)
  const [showEditItems, setShowEditItems] = useState(false)

  // Fetch group members
  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}/members`)
        if (response.ok) {
          const members = await response.json()

          // Find current user (member with user_id)
          const currentMember = members.find((member: { user_id?: string | null }) => member.user_id)

          // Transform to expected format, excluding current user from groupMembers
          const transformedMembers = members
            .filter((member: { id: string }) => member.id !== currentMember?.id) // Exclude current user
            .map((member: { id: string; nickname: string }) => ({
              id: member.id,
              name: member.nickname
            }))

          setGroupMembers(transformedMembers)

          // Set current user
          if (currentMember) {
            setCurrentUser({
              id: currentMember.id,
              name: 'You'
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch group members:', error)
        // Fallback to mock data
        setGroupMembers([
          { id: '2', name: 'Alice' },
          { id: '3', name: 'Bob' }
        ])
        setCurrentUser({ id: '1', name: 'You' })
      }
    }

    fetchGroupMembers()
  }, [groupId])

  useEffect(() => {
    const parseReceipt = async () => {
      // Get image data from sessionStorage or URL param (legacy)
      let imageData: string | null = null

      if (imageId) {
        imageData = sessionStorage.getItem(imageId)
        if (!imageData) {
          setError('Image data not found. Please try scanning again.')
          return
        }
      } else if (legacyImageData) {
        imageData = decodeURIComponent(legacyImageData)
      } else {
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
          body: JSON.stringify({ imageData }),
        })

        if (!response.ok) {
          throw new Error('Failed to parse receipt')
        }

        const data = await response.json()

        // Convert parsed items to our format and split items with quantity > 1
        const parsedItems: ReceiptItem[] = []
        data.items.forEach((item: { name: string; price: number; quantity?: number }, index: number) => {
          const quantity = item.quantity || 1
          // API already returns the price per single item, not total price
          const pricePerItem = item.price

          // Create separate items for each quantity
          for (let i = 0; i < quantity; i++) {
            parsedItems.push({
              id: `item-${index}-${i}`,
              name: quantity > 1 ? `${item.name} (${i + 1}/${quantity})` : item.name,
              price: pricePerItem,
              quantity: 1
            })
          }
        })

        setItems(parsedItems)

        // Clean up sessionStorage after successful processing
        if (imageId) {
          sessionStorage.removeItem(imageId)
        }
      } catch (error) {
        console.error('Error parsing receipt:', error)
        // Fallback to mock data for demo
        setItems([
          { id: '1', name: 'Burger', price: 12.99, quantity: 1 },
          { id: '2', name: 'French Fries', price: 4.99, quantity: 1 },
          { id: '3', name: 'Coke', price: 2.99, quantity: 2 },
          { id: '4', name: 'Pizza', price: 18.99, quantity: 1 }
        ])

        // Clean up sessionStorage even on error
        if (imageId) {
          sessionStorage.removeItem(imageId)
        }
      } finally {
        setLoading(false)
      }
    }

    parseReceipt()
  }, [imageId, legacyImageData])

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
      // Calculate total amount
      const total = items.reduce((sum, item) => sum + item.price, 0)

      // Create receipt data with detailed item information
      const receiptData = {
        id: `receipt_${Date.now()}`,
        storeName: 'Receipt', // TODO: Extract from OCR data
        date: new Date().toISOString().split('T')[0],
        total,
        items: items.length,
        status: 'pending' as const,
        assignments,
        itemDetails: items // Store actual item details for balance calculation
      }

      // Store in localStorage for immediate display (temporary solution)
      const existingReceipts = JSON.parse(localStorage.getItem(`receipts_${groupId}`) || '[]')
      existingReceipts.push(receiptData)
      localStorage.setItem(`receipts_${groupId}`, JSON.stringify(existingReceipts))

      // TODO: Also save to database
      try {
        await fetch('/api/receipts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId,
            storeName: receiptData.storeName,
            items,
            assignments,
            total
          }),
        })
      } catch (dbError) {
        console.error('Database save failed:', dbError)
        // Continue anyway since we have localStorage backup
      }

      // Redirect to main group page (now includes all summary functionality)
      window.location.href = `/groups/${groupId}`
    } catch (error) {
      console.error('Error saving receipt:', error)
      setError('Failed to save receipt assignments')
    } finally {
      setProcessing(false)
    }
  }

  const handleEditItem = (itemId: string, field: string, value: string | number) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      price: 0,
      quantity: 1
    }
    setItems(prev => [...prev, newItem])
  }

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
    // Clear assignments for removed items
    setAssignments(prev => {
      const newAssignments = { ...prev }
      delete newAssignments[itemId]
      return newAssignments
    })
  }

  const currentItem = items[currentItemIndex]
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
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditItems(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Items
              </Button>
              <Badge variant="secondary">
                {totalAssignments} of {items.length} assigned
              </Badge>
            </div>
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
                  <div className="space-y-4 mb-8 text-left">
                    {/* Per-user totals */}
                    <div className="bg-secondary/20 rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3">Cost Summary</h3>
                      <div className="space-y-2">
                        {(() => {
                          const userTotals: Record<string, number> = {}

                          items.forEach(item => {
                            const assignment = assignments[item.id]
                            if (assignment?.type === 'self') {
                              userTotals['You'] = (userTotals['You'] || 0) + item.price
                            } else if (assignment?.type === 'member' && assignment.memberName) {
                              userTotals[assignment.memberName] = (userTotals[assignment.memberName] || 0) + item.price
                            } else if (assignment?.type === 'split') {
                              const splitAmount = item.price / (groupMembers.length + 1) // +1 for current user
                              userTotals['You'] = (userTotals['You'] || 0) + splitAmount
                              groupMembers.forEach(member => {
                                userTotals[member.name] = (userTotals[member.name] || 0) + splitAmount
                              })
                            }
                          })

                          return Object.entries(userTotals).map(([userName, total]) => (
                            <div key={userName} className="flex justify-between items-center">
                              <span className="font-medium">{userName}</span>
                              <span className="font-bold">R{total.toFixed(2)}</span>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>

                    {/* Item assignments */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Item Assignments</h3>
                      <div className="space-y-2">
                        {items.map(item => {
                          const assignment = assignments[item.id]
                          return (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                              <div>
                                <span className="font-medium">{item.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">R{item.price.toFixed(2)}</span>
                              </div>
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
                    </div>
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
                currentUser={currentUser || { id: '1', name: 'You' }}
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

      {/* Edit Items Modal */}
      {showEditItems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditItems(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[80vh] overflow-y-auto"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <CardTitle className="flex items-center">
                    <Edit className="w-5 h-5 mr-2" />
                    Edit Receipt Items
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={handleAddItem}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center p-4 border rounded-lg bg-gray-50">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Item Name</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleEditItem(item.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded text-sm bg-white"
                            placeholder="Enter item name"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Price (each)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleEditItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-input rounded text-sm bg-white"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleEditItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-input rounded text-sm bg-white"
                            placeholder="1"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="font-bold text-sm">R{(item.price * item.quantity).toFixed(2)}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive p-1 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {items.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="mb-2">No items yet</p>
                    <p className="text-sm">Click &quot;Add Item&quot; to start adding items to your receipt</p>
                  </div>
                )}

                {/* Total Summary */}
                <div className="p-4 bg-secondary/20 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Receipt Total:</span>
                    <span className="text-xl font-bold">
                      R{items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {items.length} item{items.length !== 1 ? 's' : ''} total
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditItems(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setShowEditItems(false)}
                    className="flex-1"
                    disabled={items.length === 0 || items.some(item => !item.name.trim())}
                  >
                    Done Editing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}