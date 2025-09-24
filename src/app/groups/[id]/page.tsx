'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Receipt, DollarSign, Plus, Trash2, Eye, FileText, Loader2, AlertTriangle, Clock, Edit } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  created_by?: string
}

interface Member {
  id: string
  name: string
  avatar_url: string | null
}

interface Receipt {
  id: string
  storeName: string
  date: string
  total: number
  items: number
  status: 'pending' | 'settled'
  assignments?: any
  itemDetails?: any[]
}

interface Balance {
  userId: string
  userName: string
  owes: number
  owed: number
  net: number
}

export default function GroupPage() {
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [deletingReceipt, setDeletingReceipt] = useState<Receipt | null>(null)
  const [editForm, setEditForm] = useState<{
    storeName: string
    date: string
    total: number
    items: Array<{ id: string; name: string; price: number; quantity: number }>
  }>({ storeName: '', date: '', total: 0, items: [] })

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = '/signin'
          return
        }
        setCurrentUser(user)

        // Fetch group data from API
        const response = await fetch(`/api/groups/${groupId}?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()

          setGroup(data.group)

          // Process members data
          console.log('Raw members data:', data.members)
          const processedMembers = data.members.map((member: { id: string; nickname?: string }) => ({
            id: member.id,
            name: member.nickname || 'Unknown Member',
            avatar_url: null
          }))
          setMembers(processedMembers)

          // Fetch receipts from localStorage (same as summary page)
          const localReceipts = JSON.parse(localStorage.getItem(`receipts_${groupId}`) || '[]')
          setReceipts(localReceipts)

          // Calculate balances if we have receipts
          if (localReceipts.length > 0) {
            const balances = calculateBalances(localReceipts, data.members)
            setBalances(balances)
          }
        } else {
          console.error('Failed to fetch group data')
        }
      } catch (error) {
        console.error('Error fetching group data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroupData()
  }, [groupId])

  // Calculate balances from receipts and assignments (copied from summary page)
  const calculateBalances = (receipts: any[], members: any[]): Balance[] => {
    const balanceMap: Record<string, { owes: number; owed: number; name: string }> = {}

    // Initialize balance map
    members.forEach(member => {
      balanceMap[member.id] = {
        owes: 0,
        owed: 0,
        name: member.nickname === 'You' ? 'You' : member.nickname
      }
    })

    // Process each receipt's assignments
    receipts.forEach(receipt => {
      if (receipt.assignments && receipt.itemDetails) {
        // Find who paid for the receipt (assume current user for now)
        const payerId = members.find(m => m.user_id)?.id

        Object.entries(receipt.assignments).forEach(([itemId, assignment]: [string, any]) => {
          // Find the actual item price from itemDetails
          const item = receipt.itemDetails.find((item: any) => item.id === itemId)
          if (!item) return

          const itemPrice = item.price

          if (assignment.type === 'self') {
            // Current user owes themselves nothing
            // No balance change needed
          } else if (assignment.type === 'member' && assignment.assignedTo) {
            // Someone else was assigned this item - they owe the payer
            if (balanceMap[assignment.assignedTo] && payerId) {
              balanceMap[assignment.assignedTo].owes += itemPrice
              if (balanceMap[payerId]) {
                balanceMap[payerId].owed += itemPrice
              }
            }
          } else if (assignment.type === 'split') {
            // Split evenly among all members
            const splitAmount = itemPrice / members.length
            members.forEach(member => {
              if (member.id !== payerId && balanceMap[member.id]) {
                balanceMap[member.id].owes += splitAmount
                if (balanceMap[payerId]) {
                  balanceMap[payerId].owed += splitAmount
                }
              }
            })
          }
        })
      }
    })

    // Convert to Balance array format
    return Object.entries(balanceMap).map(([userId, balance]) => ({
      userId,
      userName: balance.name,
      owes: Math.round(balance.owes * 100) / 100, // Round to 2 decimal places
      owed: Math.round(balance.owed * 100) / 100,
      net: Math.round((balance.owed - balance.owes) * 100) / 100
    })).filter(balance => balance.owes > 0 || balance.owed > 0) // Only show balances with amounts
  }

  const handleEditReceipt = (receipt: Receipt) => {
    setEditingReceipt(receipt)
    setEditForm({
      storeName: receipt.storeName,
      date: receipt.date,
      total: receipt.total,
      items: receipt.itemDetails || []
    })
  }

  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      price: 0,
      quantity: 1
    }
    setEditForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const handleRemoveItem = (itemId: string) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const handleItemChange = (itemId: string, field: string, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleSaveReceipt = () => {
    if (!editingReceipt) return

    // Calculate total from items
    const calculatedTotal = editForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Update localStorage
    const existingReceipts = JSON.parse(localStorage.getItem(`receipts_${groupId}`) || '[]')
    const updatedReceipts = existingReceipts.map((receipt: any) =>
      receipt.id === editingReceipt.id
        ? {
            ...receipt,
            storeName: editForm.storeName,
            date: editForm.date,
            total: calculatedTotal,
            items: editForm.items.length,
            itemDetails: editForm.items
          }
        : receipt
    )

    localStorage.setItem(`receipts_${groupId}`, JSON.stringify(updatedReceipts))

    // Update local state
    setReceipts(updatedReceipts)

    // Recalculate balances
    const processedMembers = members.map(member => ({
      id: member.id,
      nickname: member.name,
      user_id: member.name === 'You' ? 'current-user' : null
    }))
    const newBalances = calculateBalances(updatedReceipts, processedMembers)
    setBalances(newBalances)

    setEditingReceipt(null)
  }

  const handleDeleteReceipt = () => {
    if (!deletingReceipt) return

    // Remove from localStorage
    const existingReceipts = JSON.parse(localStorage.getItem(`receipts_${groupId}`) || '[]')
    const updatedReceipts = existingReceipts.filter((receipt: any) => receipt.id !== deletingReceipt.id)
    localStorage.setItem(`receipts_${groupId}`, JSON.stringify(updatedReceipts))

    // Update local state
    setReceipts(updatedReceipts)

    // Recalculate balances
    const processedMembers = members.map(member => ({
      id: member.id,
      nickname: member.name,
      user_id: member.name === 'You' ? 'current-user' : null
    }))
    const newBalances = calculateBalances(updatedReceipts, processedMembers)
    setBalances(newBalances)

    setDeletingReceipt(null)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!currentUser) return

    try {
      const response = await fetch(
        `/api/groups/${groupId}/members?memberId=${memberId}&userId=${currentUser.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        // Remove member from local state
        setMembers(prev => prev.filter(m => m.id !== memberId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    }
  }

  const handleDeleteGroup = async () => {
    if (!currentUser) return

    try {
      const response = await fetch(
        `/api/groups/${groupId}?userId=${currentUser.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        window.location.href = '/dashboard'
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete group')
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      alert('Failed to delete group')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">Group not found</CardTitle>
            <CardDescription className="mb-4">
              The group you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </CardDescription>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4 sm:py-0 sm:h-16">
            <Button variant="ghost" asChild className="justify-start p-0 sm:p-2">
              <Link href="/dashboard" className="text-xl font-bold">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="truncate">{group.name}</span>
              </Link>
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href={`/groups/${groupId}/scan`}>
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Scan Receipt</span>
                  <span className="sm:hidden">Scan</span>
                </Link>
              </Button>
              {group?.created_by === currentUser?.id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Delete Group</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Group Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{group.name}</CardTitle>
              {group.description && (
                <CardDescription>{group.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-5 h-5 text-primary mr-1" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-primary">{members.length}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Members</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Receipt className="w-5 h-5 text-green-600 mr-1" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{receipts.length}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Receipts</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="w-5 h-5 text-purple-600 mr-1" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">
                    R{receipts.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-5 h-5 text-orange-600 mr-1" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">
                    {receipts.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Members */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="font-medium">{member.name}</div>
                    </div>
                    {(group?.created_by === currentUser?.id && member.name !== 'You') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}

                <Button variant="outline" className="w-full mt-4" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </CardContent>
            </Card>

            {/* Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balances.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-sm mb-2">No balances yet</p>
                    <p className="text-xs">Balances will appear after adding receipts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {balances.map((balance) => (
                      <div key={balance.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium text-xs">
                              {balance.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{balance.userName}</div>
                            <div className="text-xs text-muted-foreground">
                              Owes: R{balance.owes.toFixed(2)} • Owed: R{balance.owed.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-semibold ${
                              balance.net > 0 ? 'text-green-600' : balance.net < 0 ? 'text-destructive' : 'text-muted-foreground'
                            }`}
                          >
                            {balance.net > 0 ? '+' : ''}R{balance.net.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Receipts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Receipt className="w-5 h-5 mr-2" />
                  Recent Receipts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {receipts.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No receipts yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Start by scanning your first receipt to track group expenses.
                    </p>
                    <Button asChild>
                      <Link href={`/groups/${groupId}/scan`}>
                        <FileText className="w-4 h-4 mr-2" />
                        Scan First Receipt
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {receipts.map((receipt, index) => (
                      <motion.div
                        key={receipt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 sm:p-6 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium">{receipt.storeName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {receipt.items} items • {receipt.date}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold">R{receipt.total.toFixed(2)}</div>
                              <Badge variant={receipt.status === 'settled' ? 'default' : 'secondary'} className="text-xs">
                                {receipt.status === 'settled' ? 'Settled' : 'Pending'}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditReceipt(receipt)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingReceipt(receipt)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Delete Group Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Delete Group
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete &ldquo;{group?.name}&rdquo;? This action cannot be undone.
                  All receipts and data in this group will be permanently lost.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDeleteModal(false)
                      handleDeleteGroup()
                    }}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Receipt Editing Modal */}
      {editingReceipt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingReceipt(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  Edit Receipt: {editingReceipt.storeName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Receipt Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Store Name</label>
                    <input
                      type="text"
                      value={editForm.storeName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, storeName: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md"
                      placeholder="Enter store name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium">Items</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {editForm.items.map((item, index) => (
                      <div key={item.id} className="flex gap-2 items-center p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-input rounded text-sm bg-white"
                            placeholder="Item name"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                            className="px-3 py-2 border border-input rounded text-sm bg-white"
                            placeholder="Price"
                          />
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="px-3 py-2 border border-input rounded text-sm bg-white"
                            placeholder="Qty"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {editForm.items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-2">No items yet</p>
                      <p className="text-sm">Click "Add Item" to start adding items</p>
                    </div>
                  )}
                </div>

                {/* Calculated Total */}
                <div className="p-4 bg-secondary/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Calculated Total:</span>
                    <span className="text-lg font-bold">
                      R{editForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total is automatically calculated from items above
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setEditingReceipt(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveReceipt}
                    className="flex-1"
                    disabled={editForm.items.length === 0 || !editForm.storeName.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Receipt Modal */}
      {deletingReceipt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDeletingReceipt(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Delete Receipt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Are you sure you want to delete the receipt from <strong>{deletingReceipt.storeName}</strong>?
                </p>
                <div className="bg-secondary/20 rounded-lg p-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Date:</span>
                    <span>{deletingReceipt.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Items:</span>
                    <span>{deletingReceipt.items} items</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total:</span>
                    <span>R{deletingReceipt.total.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  This action cannot be undone. All item assignments and balance calculations for this receipt will be removed.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingReceipt(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteReceipt}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Receipt
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