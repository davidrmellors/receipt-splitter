'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Camera, Loader2 } from 'lucide-react'

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Receipt Splitter</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold">Your Groups</h2>
          <Button asChild>
            <Link href="/groups/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Link>
          </Button>
        </div>

        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-16"
          >
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first group to start splitting receipts with friends.
            </p>
            <Button asChild size="lg">
              <Link href="/groups/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg leading-tight">{group.name}</CardTitle>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        <Users className="w-3 h-3 mr-1" />
                        {group.member_count}
                      </Badge>
                    </div>
                    {group.description && (
                      <CardDescription className="text-sm">
                        {group.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button asChild className="flex-1" size="sm">
                        <Link href={`/groups/${group.id}`}>
                          View Group
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Link href={`/groups/${group.id}/scan`}>
                          <Camera className="w-4 h-4 sm:mr-0 mr-2" />
                          <span className="sm:hidden">Scan Receipt</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}