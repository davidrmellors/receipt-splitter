'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Group not found</h3>
          <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              ← {group.name}
            </Link>
            <div className="flex space-x-3">
              <Link
                href={`/groups/${groupId}/summary`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Summary
              </Link>
              <Link
                href={`/groups/${groupId}/scan`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Scan Receipt
              </Link>
              {group?.created_by === currentUser?.id && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete Group
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Group Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6 mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
              {group.description && (
                <p className="text-gray-600 mb-4">{group.description}</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{members.length}</div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{receipts.length}</div>
              <div className="text-sm text-gray-600">Receipts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${receipts.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Members</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                      {(group?.created_by === currentUser?.id && member.name !== 'You') && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <button className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors">
                  + Add Member
                </button>
              </div>
            </div>
          </motion.div>

          {/* Recent Receipts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Receipts</h2>
                  <Link
                    href={`/groups/${groupId}/summary`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>

              {receipts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">📄</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start by scanning your first receipt to track group expenses.
                  </p>
                  <Link
                    href={`/groups/${groupId}/scan`}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
                  >
                    Scan First Receipt
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {receipts.map((receipt, index) => (
                    <motion.div
                      key={receipt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{receipt.storeName}</h3>
                          <p className="text-sm text-gray-600">
                            Uploaded by {receipt.uploaderName} • {receipt.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            ${receipt.total.toFixed(2)}
                          </div>
                          <button className="text-sm text-blue-600 hover:text-blue-700">
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Delete Group Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Group
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{group?.name}"? This action cannot be undone.
              All receipts and data in this group will be permanently lost.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  handleDeleteGroup()
                }}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Group
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}