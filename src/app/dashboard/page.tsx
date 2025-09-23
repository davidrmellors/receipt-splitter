'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  member_count: number
}

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/signin'
        return
      }
      setUser(user)
    }

    const fetchGroups = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = '/signin'
          return
        }

        // Fetch user's groups from API
        const response = await fetch(`/api/groups?userId=${user.id}`)
        if (response.ok) {
          const groupsData = await response.json()

          if (groupsData.length > 0) {
            // Get member counts for all groups
            const groupIds = groupsData.map((g: any) => g.id).join(',')
            const countsResponse = await fetch(`/api/groups/members-count?groupIds=${groupIds}`)
            const memberCounts = countsResponse.ok ? await countsResponse.json() : {}

            setGroups(groupsData.map((group: any) => ({
              id: group.id,
              name: group.name,
              description: group.description,
              created_at: group.created_at,
              member_count: memberCounts[group.id] || 1
            })))
          } else {
            setGroups([])
          }
        } else {
          console.error('Failed to fetch groups')
          setGroups([])
        }
      } catch (error) {
        console.error('Error fetching groups:', error)
        setGroups([])
      } finally {
        setLoading(false)
      }
    }

    getUser()
    fetchGroups()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Receipt Splitter</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Groups</h2>
          <Link
            href="/groups/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Group
          </Link>
        </div>

        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first group to start splitting receipts with friends.
            </p>
            <Link
              href="/groups/new"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Create Your First Group
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                  <span className="text-sm text-gray-500">{group.member_count} members</span>
                </div>

                {group.description && (
                  <p className="text-gray-600 text-sm mb-4">{group.description}</p>
                )}

                <div className="flex space-x-2">
                  <Link
                    href={`/groups/${group.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Group
                  </Link>
                  <Link
                    href={`/groups/${group.id}/scan`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    Scan Receipt
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}