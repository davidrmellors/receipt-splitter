'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Users, Receipt, DollarSign, Plus, Trash2, Eye, FileText, Loader2, AlertTriangle } from 'lucide-react'

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
  uploadedBy: string
  uploaderName: string
}

export default function GroupPage() {
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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
          const processedMembers = data.members.map((member: any) => ({
            id: member.id,
            name: member.nickname || 'Unknown Member',
            avatar_url: null
          }))
          setMembers(processedMembers)

          setReceipts(data.receipts)
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
              The group you're looking for doesn't exist or you don't have access to it.
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
              <Button variant="outline" size="sm" asChild>
                <Link href={`/groups/${groupId}/summary`}>
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">View Summary</span>
                  <span className="sm:hidden">Summary</span>
                </Link>
              </Button>
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
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
                    ${receipts.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Spent</div>
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
            className="lg:col-span-1"
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
          </motion.div>

          {/* Recent Receipts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <Receipt className="w-5 h-5 mr-2" />
                    Recent Receipts
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/groups/${groupId}/summary`}>
                      View All
                    </Link>
                  </Button>
                </div>
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
                              Uploaded by {receipt.uploaderName} • {receipt.date}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                            <div className="font-semibold">
                              ${receipt.total.toFixed(2)}
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
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
    </div>
  )
}